import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { gender, cohort } from '@joshinan/domain'

/** 学生登録のバリデーションスキーマ */
const createStudentSchema = z.object({
  nameEn: z.string().min(1, '英語氏名は必須です'),
  nameKanji: z.string().nullable().optional(),
  nameKana: z.string().nullable().optional(),
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
  gender: gender.schema,
  nationality: z.string().min(1, '国籍は必須です'),
  cohort: cohort.schema,
  agentId: z.string().uuid().nullable().optional(),
  email: z.string().email('有効なメールアドレスを入力してください').nullable().optional(),
  phone: z.string().nullable().optional(),
})

/**
 * 学籍番号の自動採番
 * 入学年(2桁) + コホートコード(04/07/10/01) + 連番(3桁ゼロ埋め)
 */
async function generateStudentNumber(cohortValue: string): Promise<string> {
  const now = new Date()
  const yearCode = String(now.getFullYear()).slice(-2)

  /** コホート → 月コード（2桁）のマッピング */
  const cohortCodeMap: Record<string, string> = {
    APRIL: '04',
    JULY: '07',
    OCTOBER: '10',
    JANUARY: '01',
  }
  const monthCode = cohortCodeMap[cohortValue]

  const prefix = `${yearCode}${monthCode}`

  // 同一プレフィックスの既存学生数を取得して連番を決定
  const count = await prisma.student.count({
    where: { studentNumber: { startsWith: prefix } },
  })
  const seq = String(count + 1).padStart(3, '0')

  return `${prefix}${seq}`
}

/** GET /api/students — 学生一覧（フィルタ・検索・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cohortFilter = searchParams.get('cohort')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 50

    // フィルタ条件の構築
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (cohortFilter) where.cohort = cohortFilter
    if (search) {
      where.OR = [
        { nameKanji: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { studentNumber: 'asc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true,
          studentNumber: true,
          nameKanji: true,
          nameEn: true,
          nationality: true,
          status: true,
          cohort: true,
        },
      }),
      prisma.student.count({ where }),
    ])

    return okList(students, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/students — 学生登録（学籍番号自動採番） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createStudentSchema)

    const studentNumber = await generateStudentNumber(body.cohort)

    const student = await prisma.student.create({
      data: {
        studentNumber,
        nameEn: body.nameEn,
        nameKanji: body.nameKanji ?? null,
        nameKana: body.nameKana ?? null,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        nationality: body.nationality,
        cohort: body.cohort,
        agentId: body.agentId ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        // 初期ステータス: 入学前（申請予定）
        status: 'PRE_ENROLLMENT',
        preEnrollmentStatus: 'APPLICATION_PLANNED',
      },
    })

    return ok(student)
  } catch (error) {
    return handleApiError(error)
  }
}
