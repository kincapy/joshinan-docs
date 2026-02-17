import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { timeSlot } from '@joshinan/domain'

/** 時限登録のバリデーションスキーマ */
const createPeriodSchema = z.object({
  periodNumber: z.number().int().positive('時限番号は正の整数です'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 形式で入力してください'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 形式で入力してください'),
  timeSlot: timeSlot.schema,
}).refine(
  (data) => data.startTime < data.endTime,
  { message: '開始時刻は終了時刻より前にしてください', path: ['endTime'] },
)

/** GET /api/periods — 時限一覧 */
export async function GET() {
  try {
    await requireAuth()

    const periods = await prisma.period.findMany({
      orderBy: { periodNumber: 'asc' },
    })

    return ok(periods)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/periods — 時限登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createPeriodSchema)

    const period = await prisma.period.create({
      data: {
        periodNumber: body.periodNumber,
        startTime: body.startTime,
        endTime: body.endTime,
        timeSlot: body.timeSlot,
      },
    })

    return ok(period)
  } catch (error) {
    return handleApiError(error)
  }
}
