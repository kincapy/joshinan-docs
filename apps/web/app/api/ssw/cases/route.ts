import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, okList, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** 案件登録スキーマ */
const createCaseSchema = z.object({
  companyId: z.string().uuid('企業IDが不正です'),
  studentId: z.string().uuid('学生IDが不正です'),
  field: z.enum([
    'NURSING_CARE',
    'ACCOMMODATION',
    'FOOD_SERVICE',
    'FOOD_MANUFACTURING',
    'AUTO_TRANSPORT',
  ]),
  referralFee: z.number().int().positive().optional(),
  monthlySupportFee: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

/**
 * 書類マスタ定義
 * 案件作成時に条件分岐ルールに基づいて必要書類を自動生成する
 */
const DOCUMENT_MASTER = {
  // 申請書類（DOC系）
  'DOC-001': '在留資格変更許可申請書（申請人）',
  'DOC-002': '在留資格変更許可申請書（所属機関）',
  'DOC-003': '特定技能雇用契約書',
  'DOC-004': '雇用条件書',
  'DOC-005': '1号特定技能外国人支援計画書',
  'DOC-006': '特定技能所属機関概要書',
  'DOC-007': '報酬説明書',
  'DOC-008': '雇用経緯説明書',
  'DOC-009': '委託契約説明書',
  'DOC-010': '分野別一覧表',
  'DOC-011': '所属機関誓約書（分野別）',
  'DOC-012': '登録支援機関誓約書（分野別）',
  'DOC-013': '協力確認書',
  // 証憑書類（COL系）- 共通
  'COL-001': '健康診断個人票',
  'COL-002': '受診者の申告書',
  'COL-003': '技能試験合格証明書の写し',
  'COL-004': '日本語試験合格証明書の写し',
  'COL-005': '住民税課税証明書',
  'COL-006': '住民税納税証明書',
  'COL-007': 'パスポートの写し',
  'COL-008': '国民健康保険被保険者証の写し',
  'COL-009': '国民健康保険料納付証明書',
  'COL-010': '国民年金手帳の写し',
  'COL-011': '国民年金保険料領収証書の写し',
  // 企業から収集
  'COL-012': '登記事項証明書',
  'COL-013': '役員の住民票の写し',
  'COL-014': '労働保険料等納付証明書',
  'COL-015': '社会保険料納入確認回答票',
  'COL-016': '納税証明書（その3）',
  'COL-017': '法人税の確定申告書の写し',
  'COL-018': '協議会加入証明書',
  // 国籍条件
  'COL-019': '二国間取決に係る書類',
  // 分野別
  'COL-020': '介護日本語評価試験合格証明書',
  'COL-021': '旅館業許可証の写し',
  'COL-022': '運転免許証の写し',
  'COL-023': '自動車運送業協議会構成員資格証明書',
} as const

/** 二国間取決対象国 */
const BILATERAL_COUNTRIES = ['カンボジア', 'タイ', 'ベトナム']

/**
 * 条件分岐ルールに基づき、必要書類リストを生成する
 * @param field 分野
 * @param nationality 学生の国籍
 */
function generateRequiredDocuments(
  field: string,
  nationality: string,
): { documentCode: string; documentName: string; required: boolean; skipReason: string | null }[] {
  const documents: {
    documentCode: string
    documentName: string
    required: boolean
    skipReason: string | null
  }[] = []

  for (const [code, name] of Object.entries(DOCUMENT_MASTER)) {
    let required = true
    let skipReason: string | null = null

    // 分野別書類の条件判定
    if (code === 'COL-020') {
      // 介護分野のみ必須
      if (field !== 'NURSING_CARE') {
        required = false
        skipReason = '介護分野以外のため不要'
      }
    } else if (code === 'COL-021') {
      // 宿泊分野のみ必須
      if (field !== 'ACCOMMODATION') {
        required = false
        skipReason = '宿泊分野以外のため不要'
      }
    } else if (code === 'COL-022' || code === 'COL-023') {
      // 自動車運送業分野のみ必須
      if (field !== 'AUTO_TRANSPORT') {
        required = false
        skipReason = '自動車運送業分野以外のため不要'
      }
    } else if (code === 'COL-019') {
      // 二国間取決対象国のみ必須
      if (!BILATERAL_COUNTRIES.includes(nationality)) {
        required = false
        skipReason = '二国間取決対象国以外のため不要'
      }
    }

    documents.push({
      documentCode: code,
      documentName: name,
      required,
      skipReason,
    })
  }

  return documents
}

/**
 * GET /api/ssw/cases - 案件一覧
 * フィルタ: status, field, search（企業名）
 * ページネーション: 30件/ページ
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const field = searchParams.get('field')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))

    // フィルタ条件
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (field) where.field = field
    if (search) {
      where.company = { name: { contains: search, mode: 'insensitive' } }
    }

    const [cases, total] = await Promise.all([
      prisma.sswCase.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          student: {
            select: { id: true, nameEn: true, nameKanji: true, studentNumber: true, nationality: true },
          },
          documents: { select: { required: true, status: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.sswCase.count({ where }),
    ])

    // 算出プロパティ: 書類進捗率
    const data = cases.map((c) => {
      const requiredDocs = c.documents.filter((d) => d.required)
      const completedDocs = requiredDocs.filter((d) => d.status === 'COMPLETED')
      return {
        ...c,
        documentProgress:
          requiredDocs.length > 0
            ? Math.round((completedDocs.length / requiredDocs.length) * 100)
            : 0,
        documents: undefined,
      }
    })

    return okList(data, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/ssw/cases - 案件登録
 * 条件分岐ルールに基づき必要書類を自動生成する
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createCaseSchema)

    // 学生の国籍を取得（書類の条件分岐に使用）
    const student = await prisma.student.findUnique({
      where: { id: body.studentId },
      select: { nationality: true },
    })
    if (!student) {
      return errorResponse('学生が見つかりません', 404)
    }

    // 必要書類リストを生成
    const requiredDocs = generateRequiredDocuments(body.field, student.nationality)

    // 案件 + 書類をトランザクションで一括作成
    const sswCase = await prisma.sswCase.create({
      data: {
        companyId: body.companyId,
        studentId: body.studentId,
        field: body.field,
        referralFee: body.referralFee ?? 150000,
        monthlySupportFee: body.monthlySupportFee ?? 10000,
        notes: body.notes,
        documents: {
          create: requiredDocs.map((doc) => ({
            documentCode: doc.documentCode,
            documentName: doc.documentName,
            required: doc.required,
            status: doc.required ? 'NOT_STARTED' : 'NOT_REQUIRED',
            skipReason: doc.skipReason,
          })),
        },
      },
      include: {
        company: { select: { id: true, name: true } },
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
        documents: true,
      },
    })

    return ok(sswCase)
  } catch (error) {
    return handleApiError(error)
  }
}
