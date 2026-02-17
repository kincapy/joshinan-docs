import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string; memberId: string }> }

/** メンバー権限変更のバリデーションスキーマ */
const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']),
})

/** PATCH /api/projects/:id/members/:memberId -- メンバーの権限変更 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id, memberId } = await params
    const body = await parseBody(request, updateMemberSchema)

    // プロジェクトの存在確認
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: body.role },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/projects/:id/members/:memberId -- メンバー削除 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id, memberId } = await params

    // プロジェクトの存在確認
    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true, ownerId: true },
    })

    // 削除対象のメンバーを取得
    const member = await prisma.projectMember.findUniqueOrThrow({
      where: { id: memberId },
    })

    // オーナー自身は削除不可（プロジェクトには必ず1人のオーナーが必要）
    if (member.userId === project.ownerId) {
      return errorResponse('プロジェクトオーナーは削除できません', 400)
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    return ok({ id: memberId })
  } catch (error) {
    return handleApiError(error)
  }
}
