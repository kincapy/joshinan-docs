import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody, parseQuery } from '@/lib/api/validation'
import { enrollmentMonth } from '@joshinan/domain'

/** 入学時期登録のバリデーションスキーマ */
const createEnrollmentPeriodSchema = z.object({
  enrollmentMonth: enrollmentMonth.schema,
  fiscalYear: z.number().int().min(2000, '年度は2000以上').max(2100, '年度は2100以下'),
  recruitmentCapacity: z.number().int().positive('募集定員は正の整数です'),
})

/** 年度フィルタのスキーマ */
const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/schools/:id/enrollment-periods — 入学時期一覧（年度フィルタ対応） */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const query = parseQuery(request, querySchema)

    const periods = await prisma.enrollmentPeriod.findMany({
      where: {
        schoolId: id,
        ...(query.fiscalYear ? { fiscalYear: query.fiscalYear } : {}),
      },
      orderBy: [{ fiscalYear: 'desc' }, { enrollmentMonth: 'asc' }],
    })

    return ok(periods)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/schools/:id/enrollment-periods — 入学時期登録 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, createEnrollmentPeriodSchema)

    // 在籍期間は入学月から自動設定（入管制度で定められた標準期間）
    const durationMonths = enrollmentMonth.getDurationMonths(body.enrollmentMonth)

    const period = await prisma.enrollmentPeriod.create({
      data: {
        schoolId: id,
        enrollmentMonth: body.enrollmentMonth,
        fiscalYear: body.fiscalYear,
        recruitmentCapacity: body.recruitmentCapacity,
        durationMonths,
      },
    })

    return ok(period)
  } catch (error) {
    return handleApiError(error)
  }
}
