import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** セッション作成のバリデーションスキーマ */
const createSessionSchema = z.object({
  /** タイトルは省略可（最初のメッセージから自動生成する運用を想定） */
  title: z.string().min(1, 'タイトルは1文字以上です').optional(),
})

/** GET /api/chat/sessions — チャットセッション一覧（自分のセッションのみ） */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

    // ログインユーザー自身のセッションのみ取得する
    const where = { userId: user.id }

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          // 一覧画面でメッセージ数を表示するために件数だけ取得
          _count: { select: { messages: true } },
        },
      }),
      prisma.chatSession.count({ where }),
    ])

    return okList(sessions, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/chat/sessions — 新規チャットセッション作成 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await parseBody(request, createSessionSchema)

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: body.title ?? null,
      },
    })

    return ok(session)
  } catch (error) {
    return handleApiError(error)
  }
}
