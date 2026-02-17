import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 別名登録のバリデーションスキーマ */
const createAliasSchema = z.object({
  aliasName: z.string().min(1, '別名は必須です'),
})

/** GET /api/agents/:id/aliases — 別名一覧 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    const aliases = await prisma.agentAlias.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'asc' },
    })

    return ok(aliases)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/agents/:id/aliases — 別名登録 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, createAliasSchema)

    // エージェントの存在確認
    await prisma.agent.findUniqueOrThrow({ where: { id } })

    const alias = await prisma.agentAlias.create({
      data: {
        agentId: id,
        aliasName: body.aliasName,
      },
    })

    return ok(alias)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/agents/:id/aliases — 別名削除（クエリパラメータで aliasId 指定） */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const aliasId = searchParams.get('aliasId')
    if (!aliasId) {
      return errorResponse('aliasId is required', 400)
    }

    // 対象エージェントに属する別名か確認
    await prisma.agentAlias.findFirstOrThrow({
      where: { id: aliasId, agentId: id },
    })

    await prisma.agentAlias.delete({ where: { id: aliasId } })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
