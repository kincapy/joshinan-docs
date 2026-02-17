import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** メンバー追加のバリデーションスキーマ */
const addMemberSchema = z.object({
  userId: z.string().uuid('ユーザーIDが不正です'),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).default('VIEWER'),
})

/** GET /api/projects/:id/members -- メンバー一覧 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    // プロジェクトの存在確認
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    })

    return ok(members)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/projects/:id/members -- メンバー追加 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, addMemberSchema)

    // プロジェクトの存在確認
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    // 重複チェックは Prisma の @@unique 制約 (projectId, userId) でハンドリングされる
    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: body.userId,
        role: body.role,
      },
    })

    return ok(member)
  } catch (error) {
    return handleApiError(error)
  }
}
