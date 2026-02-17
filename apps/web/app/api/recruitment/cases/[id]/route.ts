import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { errorResponse } from '@/lib/api/response'

/** 申請ステータスの値一覧 */
const applicationStatusValues = [
  'PREPARING', 'SUBMITTED', 'GRANTED', 'DENIED', 'WITHDRAWN',
] as const

/** 申請ケース更新のバリデーションスキーマ */
const updateCaseSchema = z.object({
  candidateName: z.string().min(1).optional(),
  nationality: z.string().min(1).optional(),
  agentId: z.string().uuid().nullable().optional(),
  applicationNumber: z.string().nullable().optional(),
  status: z.enum(applicationStatusValues).optional(),
  isListedCountry: z.boolean().optional(),
  grantedDate: z.string().nullable().optional(),
  denialReason: z.string().nullable().optional(),
  studentId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/recruitment/cases/:id — 申請ケース詳細（書類・チェック結果含む） */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const caseData = await prisma.applicationCase.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true } },
        student: {
          select: { id: true, studentNumber: true, nameEn: true, nameKanji: true },
        },
        recruitmentCycle: {
          select: { id: true, enrollmentMonth: true, fiscalYear: true },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
          include: {
            checkResults: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!caseData) {
      return errorResponse('申請ケースが見つかりません', 404)
    }

    return ok(caseData)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/recruitment/cases/:id — 申請ケース更新（ステータス変更・ビジネスルール適用） */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateCaseSchema)

    /* ビジネスルール: ステータスに応じたフィールド検証 */
    if (body.status === 'GRANTED' && !body.grantedDate) {
      return errorResponse('交付日は必須です（ステータスが交付の場合）', 400)
    }
    if (body.status === 'DENIED' && !body.denialReason) {
      return errorResponse('不交付理由は必須です（ステータスが不交付の場合）', 400)
    }
    if (body.studentId && body.status !== 'GRANTED') {
      /* 既存データのステータスを確認 */
      const existing = await prisma.applicationCase.findUnique({
        where: { id },
        select: { status: true },
      })
      if (existing && existing.status !== 'GRANTED') {
        return errorResponse('学生リンクは交付済みのケースのみ設定できます', 400)
      }
    }

    const data: Record<string, unknown> = {}
    if (body.candidateName !== undefined) data.candidateName = body.candidateName
    if (body.nationality !== undefined) data.nationality = body.nationality
    if (body.agentId !== undefined) data.agentId = body.agentId
    if (body.applicationNumber !== undefined) data.applicationNumber = body.applicationNumber
    if (body.status !== undefined) data.status = body.status
    if (body.isListedCountry !== undefined) data.isListedCountry = body.isListedCountry
    if (body.grantedDate !== undefined) data.grantedDate = body.grantedDate ? new Date(body.grantedDate) : null
    if (body.denialReason !== undefined) data.denialReason = body.denialReason
    if (body.studentId !== undefined) data.studentId = body.studentId
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await prisma.applicationCase.update({
      where: { id },
      data,
      include: {
        agent: { select: { id: true, name: true } },
        student: {
          select: { id: true, studentNumber: true, nameEn: true, nameKanji: true },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
          include: {
            checkResults: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
