import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { anthropic, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/chat/claude-client'
import { buildSystemPrompt } from '@/lib/chat/system-prompt'
import { getToolDefinitions, executeToolCall } from '@/lib/chat/tools'
import type Anthropic from '@anthropic-ai/sdk'

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

/**
 * POST /api/chat/sessions/:id/messages — メッセージ送信 + Claude 応答生成
 *
 * USER メッセージの場合は SSE ストリーミングで Claude の応答をリアルタイムに返す。
 * イベント種別:
 *   - delta: テキストの差分（逐次表示用）
 *   - done:  完了通知（保存済みメッセージ ID を含む）
 *   - error: エラー通知
 */
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

    // ユーザーメッセージを DB に保存
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: body.role,
        content: body.content,
        toolCalls: body.toolCalls ?? null,
        toolResults: body.toolResults ?? null,
      },
    })

    // USER メッセージ以外は DB 保存のみで完了
    if (body.role !== 'USER') {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      })
      return ok({ status: 'saved' })
    }

    // セッションの全メッセージ履歴を取得して Claude に渡す
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    // DB の履歴を Claude API のメッセージ形式に変換
    const claudeMessages: Anthropic.MessageParam[] = history
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }))

    // SSE ストリーミングで Claude の応答をリアルタイムに返す
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        /** SSE イベントを送信するヘルパー */
        function sendEvent(event: string, data: unknown) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        }

        try {
          const fullText = await streamClaudeResponse(
            claudeMessages,
            (textDelta) => sendEvent('delta', { text: textDelta }),
          )

          // 完成したテキストを DB に保存
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'ASSISTANT',
              content: fullText,
            },
          })

          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          })

          sendEvent('done', { messageId: assistantMessage.id })
        } catch (err) {
          const message = err instanceof Error ? err.message : '応答生成に失敗しました'
          sendEvent('error', { message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// =============================================
// Claude API ストリーミング呼び出し（Tool Use ループ対応）
// =============================================

/** Tool Use の最大ループ回数（無限ループ防止） */
const MAX_TOOL_LOOPS = 5

/**
 * Claude API をストリーミングで呼び出す
 *
 * Tool Use が返された場合は内部でツールを実行し、
 * 最終応答のテキスト差分のみを onDelta コールバックで通知する
 *
 * @returns 完成したテキスト全文（DB 保存用）
 */
async function streamClaudeResponse(
  messages: Anthropic.MessageParam[],
  onDelta: (text: string) => void,
): Promise<string> {
  const systemPrompt = buildSystemPrompt()
  const tools = getToolDefinitions()
  const conversationMessages = [...messages]

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    // ストリーミングで Claude API を呼び出す
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools,
      messages: conversationMessages,
    })

    // ストリーミングイベントを処理
    let fullText = ''
    const contentBlocks: Anthropic.ContentBlock[] = []
    let stopReason: string | null = null

    // テキスト差分を逐次通知
    stream.on('text', (text) => {
      fullText += text
      onDelta(text)
    })

    // 完了を待つ
    const finalMessage = await stream.finalMessage()
    stopReason = finalMessage.stop_reason
    contentBlocks.push(...finalMessage.content)

    // end_turn（通常の応答完了）→ テキスト全文を返す
    if (stopReason === 'end_turn') {
      return fullText || extractTextFromContent(contentBlocks)
    }

    // tool_use → ツールを実行してループ継続（この間はストリーミングしない）
    if (stopReason === 'tool_use') {
      conversationMessages.push({
        role: 'assistant',
        content: contentBlocks,
      })

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of contentBlocks) {
        if (block.type === 'tool_use') {
          const result = await executeToolCall(
            block.name,
            block.input as Record<string, unknown>,
          )
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        }
      }

      conversationMessages.push({
        role: 'user',
        content: toolResults,
      })

      continue
    }

    // その他の stop_reason（max_tokens 等）
    return fullText || extractTextFromContent(contentBlocks)
  }

  return 'ツール実行の回数が上限に達しました。質問を変えてお試しください。'
}

/** Claude の応答 content ブロックからテキスト部分を抽出する */
function extractTextFromContent(
  content: Anthropic.ContentBlock[],
): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}
