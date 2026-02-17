import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { errorResponse } from '@/lib/api/response'

/** タスクステータスの値一覧 */
const statusValues = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const

/** タスク更新のバリデーションスキーマ */
const updateTaskSchema = z.object({
  status: z.enum(statusValues).optional(),
  completedAt: z.string().nullable().optional(),
  legalBasis: z.string().nullable().optional(),
  submissionMethod: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/immigration/tasks/:id — 入管タスク詳細（書類リスト含む） */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const task = await prisma.immigrationTask.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            nameEn: true,
            nameKanji: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!task) {
      return errorResponse('タスクが見つかりません', 404)
    }

    return ok(task)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/immigration/tasks/:id — 入管タスク更新（ステータス変更・完了処理） */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateTaskSchema)

    /* 完了処理: status=DONE のとき completedAt を自動設定 */
    const data: Record<string, unknown> = {}
    if (body.status !== undefined) {
      data.status = body.status
      if (body.status === 'DONE' && !body.completedAt) {
        data.completedAt = new Date()
      }
    }
    if (body.completedAt !== undefined) {
      data.completedAt = body.completedAt ? new Date(body.completedAt) : null
    }
    if (body.legalBasis !== undefined) data.legalBasis = body.legalBasis
    if (body.submissionMethod !== undefined) data.submissionMethod = body.submissionMethod
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await prisma.immigrationTask.update({
      where: { id },
      data,
      include: {
        student: {
          select: { id: true, studentNumber: true, nameEn: true, nameKanji: true },
        },
        documents: true,
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
