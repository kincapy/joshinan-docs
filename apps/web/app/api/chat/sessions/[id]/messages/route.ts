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

/** POST /api/chat/sessions/:id/messages — メッセージ送信 + Claude 応答生成 */
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

    // USER メッセージの場合のみ Claude API を呼び出す
    // （ASSISTANT / SYSTEM メッセージの直接保存はスキップ）
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

    // Claude API 呼び出し（Tool Use ループ対応）
    const assistantContent = await callClaudeWithToolLoop(claudeMessages)

    // ASSISTANT メッセージを DB に保存
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantContent,
      },
    })

    // セッションの updatedAt を更新
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    return ok(assistantMessage)
  } catch (error) {
    return handleApiError(error)
  }
}

// =============================================
// Claude API 呼び出し（Tool Use ループ対応）
// =============================================

/** Tool Use の最大ループ回数（無限ループ防止） */
const MAX_TOOL_LOOPS = 5

/**
 * Claude API を呼び出し、Tool Use が返された場合はツールを実行して
 * 最終的なテキスト応答を返す
 */
async function callClaudeWithToolLoop(
  messages: Anthropic.MessageParam[],
): Promise<string> {
  const systemPrompt = buildSystemPrompt()
  const tools = getToolDefinitions()

  // メッセージ履歴をコピー（ループ中に tool_result を追加するため）
  const conversationMessages = [...messages]

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools,
      messages: conversationMessages,
    })

    // end_turn（通常の応答完了）の場合はテキスト部分を返す
    if (response.stop_reason === 'end_turn') {
      return extractTextFromContent(response.content)
    }

    // tool_use の場合はツールを実行して結果を返す
    if (response.stop_reason === 'tool_use') {
      // Claude の応答（tool_use ブロック含む）を会話履歴に追加
      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      })

      // 各 tool_use ブロックを実行
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
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

      // ツール実行結果を会話履歴に追加してループを継続
      conversationMessages.push({
        role: 'user',
        content: toolResults,
      })

      continue
    }

    // その他の stop_reason（max_tokens 等）はテキスト部分を返す
    return extractTextFromContent(response.content)
  }

  // ループ上限に達した場合
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
