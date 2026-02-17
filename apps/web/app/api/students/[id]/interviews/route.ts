import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { interviewType } from '@joshinan/domain'

/** 面談記録登録のバリデーションスキーマ */
const createInterviewSchema = z.object({
  interviewDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
  interviewType: interviewType.schema,
  content: z.string().min(1, '内容は必須です'),
  actionItems: z.string().nullable().optional(),
})

/** GET /api/students/:id/interviews — 面談記録一覧（種別フィルタ・日付降順・ページネーション） */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id: studentId } = await params

    // 学生の存在チェック
    await prisma.student.findUniqueOrThrow({ where: { id: studentId } })

    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 20

    // フィルタ条件の構築
    const where: Record<string, unknown> = { studentId }
    if (typeFilter) where.interviewType = typeFilter

    const [records, total] = await Promise.all([
      prisma.interviewRecord.findMany({
        where,
        orderBy: { interviewDate: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          staff: { select: { id: true } },
        },
      }),
      prisma.interviewRecord.count({ where }),
    ])

    return okList(records, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/students/:id/interviews — 面談記録登録（staffId は認証ユーザーから自動設定） */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const { id: studentId } = await params
    const body = await parseBody(request, createInterviewSchema)

    // 学生の存在チェック
    await prisma.student.findUniqueOrThrow({ where: { id: studentId } })

    // 認証ユーザーのメールアドレスでスタッフを特定
    const staff = await prisma.staff.findFirstOrThrow({
      where: { email: user.email },
      select: { id: true },
    })

    const record = await prisma.interviewRecord.create({
      data: {
        studentId,
        interviewDate: new Date(body.interviewDate),
        interviewType: body.interviewType,
        staffId: staff.id,
        content: body.content,
        actionItems: body.actionItems ?? null,
      },
    })

    return ok(record)
  } catch (error) {
    return handleApiError(error)
  }
}
