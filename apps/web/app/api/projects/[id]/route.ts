import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { calcProgress } from '@/lib/project/calc-progress'

type RouteParams = { params: Promise<{ id: string }> }

/** プロジェクト更新のバリデーションスキーマ */
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED']).optional(),
})

/** GET /api/projects/:id -- プロジェクト詳細（tasks, members を include、進捗率計算） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        skill: { select: { id: true, name: true } },
        tasks: {
          orderBy: { taskCode: 'asc' },
          include: {
            template: {
              select: {
                category: true,
                actionType: true,
                description: true,
              },
            },
          },
        },
        members: true,
      },
    })

    // 進捗率を計算して付与
    const { tasks, ...rest } = project
    return ok({
      ...rest,
      tasks,
      progress: calcProgress(tasks),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH /api/projects/:id -- プロジェクト更新（status, name） */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateProjectSchema)

    // COMPLETED に変更する場合は completedAt を設定する
    const data: Record<string, unknown> = { ...body }
    if (body.status === 'COMPLETED') {
      data.completedAt = new Date()
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        skill: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
