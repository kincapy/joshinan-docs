import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { timeSlot } from '@joshinan/domain'

type RouteParams = { params: Promise<{ id: string }> }

/** 時限更新のバリデーションスキーマ */
const updatePeriodSchema = z.object({
  periodNumber: z.number().int().positive().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 形式で入力してください').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 形式で入力してください').optional(),
  timeSlot: timeSlot.schema.optional(),
})

/** PUT /api/periods/:id — 時限更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updatePeriodSchema)

    // 開始時刻と終了時刻の整合性チェック
    if (body.startTime && body.endTime && body.startTime >= body.endTime) {
      return errorResponse('開始時刻は終了時刻より前にしてください', 400)
    }

    const period = await prisma.period.update({
      where: { id },
      data: body,
    })

    return ok(period)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/periods/:id — 時限削除 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    // 時間割で使用されている時限は削除不可（Restrict 制約でエラーになる）
    await prisma.period.delete({ where: { id } })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
