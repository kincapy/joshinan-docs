import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 入学時期の値一覧（VO ローカル定義） */
const enrollmentMonthValues = ['APRIL', 'OCTOBER'] as const

/** 募集期登録のバリデーションスキーマ */
const createCycleSchema = z.object({
  enrollmentMonth: z.enum(enrollmentMonthValues),
  fiscalYear: z.number().int().min(2020).max(2100),
  applicationDeadline: z.string().min(1, '書類申請締切日は必須です'),
  visaResultDate: z.string().nullable().optional(),
  entryStartDate: z.string().nullable().optional(),
  targetCount: z.number().int().positive('募集目標人数は正の整数を指定してください'),
})

/** GET /api/recruitment/cycles — 募集期一覧（ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const per = 30

    const [cycles, total] = await Promise.all([
      prisma.recruitmentCycle.findMany({
        orderBy: [{ fiscalYear: 'desc' }, { enrollmentMonth: 'desc' }],
        skip: (page - 1) * per,
        take: per,
        include: {
          /* 申請ケースの件数をステータス別に取得するため、全件 include */
          applicationCases: {
            select: { id: true, status: true },
          },
        },
      }),
      prisma.recruitmentCycle.count(),
    ])

    /* 算出プロパティを付与して返す */
    const data = cycles.map((cycle) => {
      const cases = cycle.applicationCases
      /* 取下を除いた申請数 */
      const applicationCount = cases.filter((c) => c.status !== 'WITHDRAWN').length
      /* 交付数 */
      const grantedCount = cases.filter((c) => c.status === 'GRANTED').length
      /* 交付率 */
      const grantRate = applicationCount > 0 ? grantedCount / applicationCount : 0

      return {
        id: cycle.id,
        enrollmentMonth: cycle.enrollmentMonth,
        fiscalYear: cycle.fiscalYear,
        applicationDeadline: cycle.applicationDeadline,
        visaResultDate: cycle.visaResultDate,
        entryStartDate: cycle.entryStartDate,
        targetCount: cycle.targetCount,
        createdAt: cycle.createdAt,
        updatedAt: cycle.updatedAt,
        applicationCount,
        grantedCount,
        grantRate,
      }
    })

    return okList(data, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/recruitment/cycles — 募集期登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createCycleSchema)

    const created = await prisma.recruitmentCycle.create({
      data: {
        enrollmentMonth: body.enrollmentMonth,
        fiscalYear: body.fiscalYear,
        applicationDeadline: new Date(body.applicationDeadline),
        visaResultDate: body.visaResultDate ? new Date(body.visaResultDate) : null,
        entryStartDate: body.entryStartDate ? new Date(body.entryStartDate) : null,
        targetCount: body.targetCount,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
