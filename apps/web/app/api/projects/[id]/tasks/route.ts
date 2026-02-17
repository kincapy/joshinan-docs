import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/projects/:id/tasks -- プロジェクトのタスク一覧（sortOrder 順、フラットに返す） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    // プロジェクトの存在確認も兼ねて findUniqueOrThrow を使う
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    const tasks = await prisma.projectTask.findMany({
      where: { projectId: id },
      include: {
        template: {
          select: {
            category: true,
            actionType: true,
            description: true,
            sortOrder: true,
          },
        },
      },
      // テンプレートの sortOrder でソートする
      orderBy: {
        template: { sortOrder: 'asc' },
      },
    })

    return ok(tasks)
  } catch (error) {
    return handleApiError(error)
  }
}
