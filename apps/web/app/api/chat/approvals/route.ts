import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

const PER_PAGE = 30

/** GET /api/chat/approvals — 決裁一覧（status フィルタ・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

    // status フィルタ（PENDING / APPROVED / REJECTED）
    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [approvals, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        // 一覧画面で申請内容を把握するために関連情報を含める
        include: {
          message: {
            select: {
              id: true,
              content: true,
              session: {
                select: { id: true, title: true },
              },
            },
          },
        },
      }),
      prisma.approvalRequest.count({ where }),
    ])

    return okList(approvals, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}
