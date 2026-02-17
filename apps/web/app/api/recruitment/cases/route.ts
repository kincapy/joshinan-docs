import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 申請ステータスの値一覧（VO ローカル定義） */
const applicationStatusValues = [
  'PREPARING', 'SUBMITTED', 'GRANTED', 'DENIED', 'WITHDRAWN',
] as const

/** 書類種別の値一覧 */
const documentTypeValues = [
  'APPLICATION_FORM', 'CHECKLIST', 'PASSPORT_COPY',
  'JAPANESE_ABILITY', 'FINANCIAL_SUPPORT', 'RELATIONSHIP_PROOF',
  'BANK_BALANCE', 'FUND_FORMATION', 'SCHOLARSHIP',
  'MINOR_SUPPORT', 'REASON_STATEMENT', 'OTHER',
] as const

/** 基本書類（全ケース必須） */
const BASIC_DOCUMENTS: (typeof documentTypeValues[number])[] = [
  'APPLICATION_FORM', 'CHECKLIST', 'PASSPORT_COPY',
]

/** 別表掲載国以外で追加される書類 */
const NON_LISTED_DOCUMENTS: (typeof documentTypeValues[number])[] = [
  'JAPANESE_ABILITY', 'FINANCIAL_SUPPORT', 'RELATIONSHIP_PROOF',
  'BANK_BALANCE', 'FUND_FORMATION',
]

/** 申請ケース登録のバリデーションスキーマ */
const createCaseSchema = z.object({
  recruitmentCycleId: z.string().uuid(),
  candidateName: z.string().min(1, '候補者氏名は必須です'),
  nationality: z.string().min(1, '国籍は必須です'),
  agentId: z.string().uuid().nullable().optional(),
  isListedCountry: z.boolean(),
  notes: z.string().nullable().optional(),
})

/** GET /api/recruitment/cases — 申請ケース一覧（フィルタ・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const status = searchParams.get('status')
    const nationality = searchParams.get('nationality')
    const agentId = searchParams.get('agentId')
    const isListedCountry = searchParams.get('isListedCountry')
    const page = Number(searchParams.get('page') || '1')
    const per = 30

    const where: Record<string, unknown> = {}
    if (cycleId) where.recruitmentCycleId = cycleId
    if (status) where.status = status
    if (nationality) where.nationality = nationality
    if (agentId) where.agentId = agentId
    if (isListedCountry !== null && isListedCountry !== '') {
      where.isListedCountry = isListedCountry === 'true'
    }

    const [cases, total] = await Promise.all([
      prisma.applicationCase.findMany({
        where,
        orderBy: { candidateName: 'asc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          agent: { select: { id: true, name: true } },
          documents: {
            select: { id: true, documentType: true, collectionStatus: true },
          },
          recruitmentCycle: {
            select: { id: true, enrollmentMonth: true, fiscalYear: true },
          },
        },
      }),
      prisma.applicationCase.count({ where }),
    ])

    /* 書類充足率を算出して返す */
    const data = cases.map((c) => {
      const requiredTypes = getRequiredDocumentTypes(c.isListedCountry)
      const requiredDocs = c.documents.filter((d) =>
        requiredTypes.includes(d.documentType as (typeof documentTypeValues)[number])
      )
      const verifiedCount = requiredDocs.filter((d) => d.collectionStatus === 'VERIFIED').length
      const documentCompletionRate = requiredTypes.length > 0 ? verifiedCount / requiredTypes.length : 0

      return {
        id: c.id,
        recruitmentCycleId: c.recruitmentCycleId,
        recruitmentCycle: c.recruitmentCycle,
        candidateName: c.candidateName,
        nationality: c.nationality,
        agentId: c.agentId,
        agent: c.agent,
        applicationNumber: c.applicationNumber,
        status: c.status,
        isListedCountry: c.isListedCountry,
        grantedDate: c.grantedDate,
        notes: c.notes,
        createdAt: c.createdAt,
        documentCompletionRate,
      }
    })

    return okList(data, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/recruitment/cases — 申請ケース登録（必要書類の自動生成付き） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createCaseSchema)

    /* 必要書類リストを決定 */
    const requiredTypes = getRequiredDocumentTypes(body.isListedCountry)

    const created = await prisma.applicationCase.create({
      data: {
        recruitmentCycleId: body.recruitmentCycleId,
        candidateName: body.candidateName,
        nationality: body.nationality,
        agentId: body.agentId ?? null,
        isListedCountry: body.isListedCountry,
        notes: body.notes ?? null,
        /* 必要書類を自動生成（collectionStatus = NOT_RECEIVED） */
        documents: {
          create: requiredTypes.map((docType) => ({
            documentType: docType,
          })),
        },
      },
      include: {
        agent: { select: { id: true, name: true } },
        documents: true,
        recruitmentCycle: {
          select: { id: true, enrollmentMonth: true, fiscalYear: true },
        },
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 必要書類リスト自動生成アルゴリズム
 * - 基本書類は全ケース必須
 * - 別表掲載国以外はさらに追加書類が必要
 */
function getRequiredDocumentTypes(isListedCountry: boolean): (typeof documentTypeValues[number])[] {
  if (isListedCountry) {
    return [...BASIC_DOCUMENTS]
  }
  return [...BASIC_DOCUMENTS, ...NON_LISTED_DOCUMENTS]
}
