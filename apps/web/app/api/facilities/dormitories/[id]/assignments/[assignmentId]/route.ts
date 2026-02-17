import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string; assignmentId: string }> }

/** 退寮処理のバリデーションスキーマ */
const endAssignmentSchema = z.object({
  moveOutDate: z.string().min(1, '退寮日は必須です'),
})

/** PUT /api/facilities/dormitories/:id/assignments/:assignmentId -- 退寮処理 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { assignmentId } = await params
    const body = await parseBody(request, endAssignmentSchema)

    // status を ENDED に変更し、退寮日を設定
    const updated = await prisma.dormitoryAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'ENDED',
        moveOutDate: new Date(body.moveOutDate),
      },
      include: {
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok({
      ...updated,
      moveInDate: updated.moveInDate.toISOString().split('T')[0],
      moveOutDate: updated.moveOutDate ? updated.moveOutDate.toISOString().split('T')[0] : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
