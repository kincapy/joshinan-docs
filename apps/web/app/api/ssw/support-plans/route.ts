import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, okList, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** 支援計画登録スキーマ */
const createSupportPlanSchema = z.object({
  caseId: z.string().uuid('案件IDが不正です'),
  studentId: z.string().uuid('学生IDが不正です'),
  startDate: z.string().min(1, '支援開始日は必須です'),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional(),
})

/** 支援計画更新スキーマ */
const updateSupportPlanSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * GET /api/ssw/support-plans - 支援計画一覧
 * フィルタ: status
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status) where.status = status

    const [plans, total] = await Promise.all([
      prisma.supportPlan.findMany({
        where,
        include: {
          sswCase: {
            include: {
              company: { select: { id: true, name: true } },
            },
          },
          student: {
            select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
          },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.supportPlan.count({ where }),
    ])

    return okList(plans, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/ssw/support-plans - 支援計画登録
 * 同一学生に対して ACTIVE な計画は1つのみ
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSupportPlanSchema)

    // 同一学生に ACTIVE な支援計画がないか確認
    const existing = await prisma.supportPlan.findFirst({
      where: { studentId: body.studentId, status: 'ACTIVE' },
    })
    if (existing) {
      return errorResponse('この学生には既に実施中の支援計画があります', 409)
    }

    const plan = await prisma.supportPlan.create({
      data: {
        caseId: body.caseId,
        studentId: body.studentId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes,
      },
      include: {
        sswCase: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok(plan)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/ssw/support-plans - 支援計画更新（ステータス変更）
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, updateSupportPlanSchema)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (body.status) data.status = body.status
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null
    }
    if (body.notes !== undefined) data.notes = body.notes

    // COMPLETED に変更する場合は endDate が必須
    if (body.status === 'COMPLETED' && !body.endDate) {
      return errorResponse('完了に変更する場合は終了日を入力してください', 400)
    }

    const plan = await prisma.supportPlan.update({
      where: { id: body.id },
      data,
      include: {
        sswCase: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok(plan)
  } catch (error) {
    return handleApiError(error)
  }
}
