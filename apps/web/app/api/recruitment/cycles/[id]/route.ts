import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { errorResponse } from '@/lib/api/response'

/** 入学時期の値一覧（VO ローカル定義） */
const enrollmentMonthValues = ['APRIL', 'OCTOBER'] as const

/** 募集期更新のバリデーションスキーマ */
const updateCycleSchema = z.object({
  enrollmentMonth: z.enum(enrollmentMonthValues).optional(),
  fiscalYear: z.number().int().min(2020).max(2100).optional(),
  applicationDeadline: z.string().optional(),
  visaResultDate: z.string().nullable().optional(),
  entryStartDate: z.string().nullable().optional(),
  targetCount: z.number().int().positive().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/recruitment/cycles/:id — 募集期詳細（申請ケースのサマリー付き） */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const cycle = await prisma.recruitmentCycle.findUnique({
      where: { id },
      include: {
        applicationCases: {
          select: { id: true, status: true, nationality: true },
        },
      },
    })

    if (!cycle) {
      return errorResponse('募集期が見つかりません', 404)
    }

    /* 算出プロパティ */
    const cases = cycle.applicationCases
    const applicationCount = cases.filter((c) => c.status !== 'WITHDRAWN').length
    const grantedCount = cases.filter((c) => c.status === 'GRANTED').length
    const grantRate = applicationCount > 0 ? grantedCount / applicationCount : 0

    /* ステータス別件数 */
    const statusCounts: Record<string, number> = {}
    for (const c of cases) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
    }

    /* 国籍別件数 */
    const nationalityCounts: Record<string, number> = {}
    for (const c of cases) {
      nationalityCounts[c.nationality] = (nationalityCounts[c.nationality] || 0) + 1
    }

    return ok({
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
      statusCounts,
      nationalityCounts,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/recruitment/cycles/:id — 募集期更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateCycleSchema)

    const data: Record<string, unknown> = {}
    if (body.enrollmentMonth !== undefined) data.enrollmentMonth = body.enrollmentMonth
    if (body.fiscalYear !== undefined) data.fiscalYear = body.fiscalYear
    if (body.applicationDeadline !== undefined) data.applicationDeadline = new Date(body.applicationDeadline)
    if (body.visaResultDate !== undefined) data.visaResultDate = body.visaResultDate ? new Date(body.visaResultDate) : null
    if (body.entryStartDate !== undefined) data.entryStartDate = body.entryStartDate ? new Date(body.entryStartDate) : null
    if (body.targetCount !== undefined) data.targetCount = body.targetCount

    const updated = await prisma.recruitmentCycle.update({
      where: { id },
      data,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
