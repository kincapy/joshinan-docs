import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 決裁処理のバリデーションスキーマ */
const resolveApprovalSchema = z.object({
  /** 承認 or 却下 のみ指定可。PENDING への戻しは不可 */
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'status は APPROVED または REJECTED です' }),
  }),
  /** 却下理由（却下時に入力可） */
  reason: z.string().optional(),
})

/** GET /api/chat/approvals/:id — 決裁詳細 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const approval = await prisma.approvalRequest.findUniqueOrThrow({
      where: { id },
      include: {
        // 決裁詳細画面でメッセージ・セッション情報を表示するため
        message: {
          include: {
            session: {
              select: { id: true, title: true, userId: true },
            },
          },
        },
      },
    })

    return ok(approval)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH /api/chat/approvals/:id — 承認/却下処理 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await parseBody(request, resolveApprovalSchema)

    // 既に決裁済みの申請は再処理不可
    const existing = await prisma.approvalRequest.findUniqueOrThrow({
      where: { id },
    })
    if (existing.status !== 'PENDING') {
      return errorResponse('この申請は既に処理済みです', 400)
    }

    const approval = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: body.status,
        reason: body.reason ?? null,
        // 決裁者を記録（承認/却下を実行したユーザー）
        approverId: user.id,
        resolvedAt: new Date(),
      },
    })

    return ok(approval)
  } catch (error) {
    return handleApiError(error)
  }
}
