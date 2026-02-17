import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 支援計画更新スキーマ（id は URL パラメータから取得するため不要） */
const updateSupportPlanSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * PUT /api/ssw/support-plans/:id - 支援計画更新（ステータス変更）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSupportPlanSchema)

    // COMPLETED に変更する場合は endDate が必須（data 構築の前にバリデーション）
    if (body.status === 'COMPLETED' && !body.endDate) {
      return errorResponse('完了に変更する場合は終了日を入力してください', 400)
    }

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null
    }
    if (body.notes !== undefined) data.notes = body.notes

    const plan = await prisma.supportPlan.update({
      where: { id },
      data,
      include: {
        sswCase: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok(plan)
  } catch (error) {
    return handleApiError(error)
  }
}
