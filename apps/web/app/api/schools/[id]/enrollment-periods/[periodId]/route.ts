import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { enrollmentMonth } from '@joshinan/domain'

/** 入学時期更新のバリデーションスキーマ */
const updateEnrollmentPeriodSchema = z.object({
  enrollmentMonth: enrollmentMonth.schema.optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  recruitmentCapacity: z.number().int().positive('募集定員は正の整数です').optional(),
})

type RouteParams = { params: Promise<{ id: string; periodId: string }> }

/** PUT /api/schools/:id/enrollment-periods/:periodId — 入学時期更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { periodId } = await params
    const body = await parseBody(request, updateEnrollmentPeriodSchema)

    // 入学月が変更された場合、在籍期間も自動更新
    const data = body.enrollmentMonth
      ? { ...body, durationMonths: enrollmentMonth.getDurationMonths(body.enrollmentMonth) }
      : body

    const period = await prisma.enrollmentPeriod.update({
      where: { id: periodId },
      data,
    })

    return ok(period)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/schools/:id/enrollment-periods/:periodId — 入学時期削除 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { periodId } = await params

    await prisma.enrollmentPeriod.delete({
      where: { id: periodId },
    })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
