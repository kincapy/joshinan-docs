import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** AssignmentStatus のローカル定義（worktree で @joshinan/domain を使わない） */
const assignmentStatusValues = ['ACTIVE', 'ENDED'] as const
const assignmentStatusSchema = z.enum(assignmentStatusValues)

/** 入寮登録のバリデーションスキーマ */
const createAssignmentSchema = z.object({
  studentId: z.string().uuid('学生IDが無効です'),
  moveInDate: z.string().min(1, '入寮日は必須です'),
})

/** GET /api/facilities/dormitories/:id/assignments -- 入寮履歴一覧 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // ステータスフィルタ（ACTIVE / ENDED / 全件）
    const where: Record<string, unknown> = { dormitoryId: id }
    if (statusFilter && assignmentStatusSchema.safeParse(statusFilter).success) {
      where.status = statusFilter
    }

    const assignments = await prisma.dormitoryAssignment.findMany({
      where,
      include: {
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
      orderBy: { moveInDate: 'desc' },
    })

    const result = assignments.map((a) => ({
      ...a,
      moveInDate: a.moveInDate.toISOString().split('T')[0],
      moveOutDate: a.moveOutDate ? a.moveOutDate.toISOString().split('T')[0] : null,
    }))

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/facilities/dormitories/:id/assignments -- 入寮登録 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, createAssignmentSchema)

    // 寮の存在確認
    await prisma.dormitory.findUniqueOrThrow({ where: { id } })

    // 同一学生が既にこの寮で ACTIVE の場合はエラー
    const existing = await prisma.dormitoryAssignment.findFirst({
      where: {
        studentId: body.studentId,
        dormitoryId: id,
        status: 'ACTIVE',
      },
    })
    if (existing) {
      return ok({ error: 'この学生は既にこの寮に入居中です' })
    }

    const created = await prisma.dormitoryAssignment.create({
      data: {
        studentId: body.studentId,
        dormitoryId: id,
        status: 'ACTIVE',
        moveInDate: new Date(body.moveInDate),
      },
      include: {
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok({
      ...created,
      moveInDate: created.moveInDate.toISOString().split('T')[0],
      moveOutDate: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
