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

/** GET /api/projects/:id/tasks/:taskId -- タスク詳細取得（ステータス変更履歴付き） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id, taskId } = await params

    // プロジェクトの存在確認
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    const task = await prisma.projectTask.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        template: {
          select: {
            category: true,
            actionType: true,
            description: true,
          },
        },
        // ステータス変更履歴を新しい順で取得
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
      },
    })

    return ok(task)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH /api/projects/:id/tasks/:taskId -- タスク更新（ステータス変更履歴を記録） */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id, taskId } = await params
    const body = await parseBody(request, updateTaskSchema)

    // プロジェクトの存在確認（URLの id が正しいか検証する）
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    // ステータス変更がある場合、変更前のステータスを取得して履歴に記録する
    if (body.status) {
      const currentTask = await prisma.projectTask.findUniqueOrThrow({
        where: { id: taskId },
        select: { status: true },
      })

      // 変更前と変更後が異なる場合のみ履歴を記録
      if (currentTask.status !== body.status) {
        await prisma.projectTaskStatusLog.create({
          data: {
            taskId,
            fromStatus: currentTask.status,
            toStatus: body.status,
            changedById: user.id,
          },
        })
      }
    }

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
      include: {
        template: {
          select: {
            category: true,
            actionType: true,
            description: true,
          },
        },
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
