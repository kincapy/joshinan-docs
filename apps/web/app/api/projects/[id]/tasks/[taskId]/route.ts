import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string; taskId: string }> }

/** タスク更新のバリデーションスキーマ */
const updateTaskSchema = z.object({
  status: z
    .enum([
      'NOT_STARTED',
      'IN_PROGRESS',
      'COMPLETED',
      'NOT_REQUIRED',
      'RETURNED',
    ])
    .optional(),
  notes: z.string().nullable().optional(),
  filePath: z.string().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
})

/** PATCH /api/projects/:id/tasks/:taskId -- タスク更新 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id, taskId } = await params
    const body = await parseBody(request, updateTaskSchema)

    // プロジェクトの存在確認（URLの id が正しいか検証する）
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    const data: Record<string, unknown> = { ...body }

    // COMPLETED に変更された場合は completedAt を設定する
    if (body.status === 'COMPLETED') {
      data.completedAt = new Date()
    }
    // COMPLETED 以外に戻された場合は completedAt をクリアする
    if (body.status && body.status !== 'COMPLETED') {
      data.completedAt = null
    }

    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
