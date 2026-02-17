import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** セッション更新のバリデーションスキーマ */
const updateSessionSchema = z.object({
  title: z.string().min(1, 'タイトルは1文字以上です'),
})

/** GET /api/chat/sessions/:id — セッション詳細（メッセージ含む） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const session = await prisma.chatSession.findUniqueOrThrow({
      where: { id },
      include: {
        // メッセージを時系列順で取得（チャット表示用）
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // 他ユーザーのセッションにはアクセスさせない
    if (session.userId !== user.id) {
      return errorResponse('このセッションにアクセスする権限がありません', 403)
    }

    return ok(session)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH /api/chat/sessions/:id — セッションタイトル更新 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSessionSchema)

    // 所有者チェック：自分のセッションのみ更新可
    const existing = await prisma.chatSession.findUniqueOrThrow({
      where: { id },
    })
    if (existing.userId !== user.id) {
      return errorResponse('このセッションを更新する権限がありません', 403)
    }

    const session = await prisma.chatSession.update({
      where: { id },
      data: { title: body.title },
    })

    return ok(session)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/chat/sessions/:id — セッション削除（CASCADE でメッセージも削除） */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // 所有者チェック：自分のセッションのみ削除可
    const existing = await prisma.chatSession.findUniqueOrThrow({
      where: { id },
    })
    if (existing.userId !== user.id) {
      return errorResponse('このセッションを削除する権限がありません', 403)
    }

    // onDelete: Cascade により関連メッセージも自動削除される
    await prisma.chatSession.delete({ where: { id } })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
