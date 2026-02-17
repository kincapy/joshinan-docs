import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** メッセージ送信のバリデーションスキーマ */
const createMessageSchema = z.object({
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM'], {
    errorMap: () => ({ message: 'role は USER, ASSISTANT, SYSTEM のいずれかです' }),
  }),
  content: z.string().min(1, 'メッセージ本文は必須です'),
  /** Claude API の Tool Use 呼び出し内容（JSON） */
  toolCalls: z.any().optional(),
  /** Tool Use の実行結果（JSON） */
  toolResults: z.any().optional(),
})

/** GET /api/chat/sessions/:id/messages — メッセージ一覧（時系列順） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id: sessionId } = await params

    // セッションの所有者チェック
    const session = await prisma.chatSession.findUniqueOrThrow({
      where: { id: sessionId },
    })
    if (session.userId !== user.id) {
      return errorResponse('このセッションにアクセスする権限がありません', 403)
    }

    // チャット表示のためメッセージを時系列の昇順で返す
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return ok(messages)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/chat/sessions/:id/messages — メッセージ送信 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id: sessionId } = await params
    const body = await parseBody(request, createMessageSchema)

    // セッションの所有者チェック
    const session = await prisma.chatSession.findUniqueOrThrow({
      where: { id: sessionId },
    })
    if (session.userId !== user.id) {
      return errorResponse('このセッションにメッセージを送信する権限がありません', 403)
    }

    // メッセージ作成と同時にセッションの updatedAt を更新する
    // （最終アクティブ順でのソートに使用）
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: body.role,
          content: body.content,
          toolCalls: body.toolCalls ?? null,
          toolResults: body.toolResults ?? null,
        },
      }),
      prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }),
    ])

    return ok(message)
  } catch (error) {
    return handleApiError(error)
  }
}
