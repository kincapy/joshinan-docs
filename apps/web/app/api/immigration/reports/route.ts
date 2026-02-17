import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 定期報告種別の値一覧 */
const reportTypeValues = [
  'ENROLLMENT_COUNT_MAY',
  'ENROLLMENT_COUNT_NOV',
  'ATTENDANCE_FIRST_HALF',
  'ATTENDANCE_SECOND_HALF',
  'PERIODIC_INSPECTION',
  'COURSE_COMPLETION',
  'OPERATION_STATUS',
  'BUSINESS_PLAN',
] as const

/** タスクステータスの値一覧 */
const statusValues = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const

/** 定期報告の期限マスタ（月-日 形式） */
const reportDeadlines: Record<string, string> = {
  ENROLLMENT_COUNT_MAY: '05-14',
  ENROLLMENT_COUNT_NOV: '11-14',
  ATTENDANCE_FIRST_HALF: '12-31',
  ATTENDANCE_SECOND_HALF: '06-30',
  PERIODIC_INSPECTION: '06-30',
  COURSE_COMPLETION: '06-30',
  OPERATION_STATUS: '06-30',
  BUSINESS_PLAN: '04-30',
}

/** 年度一括生成のバリデーションスキーマ */
const generateSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100),
})

/** 定期報告更新のバリデーションスキーマ */
const updateReportSchema = z.object({
  status: z.enum(statusValues).optional(),
  completedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/** GET /api/immigration/reports — 定期報告一覧（年度フィルタ） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscalYear')

    const where: Record<string, unknown> = {}
    if (fiscalYear) where.fiscalYear = Number(fiscalYear)

    const reports = await prisma.scheduledReport.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { deadline: 'asc' }],
    })

    return ok(reports)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/immigration/reports — 年度の定期報告を一括生成（upsert） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, generateSchema)

    /* 全8種別の定期報告を upsert で作成（既存があればスキップ） */
    const results = await Promise.all(
      reportTypeValues.map((reportType) => {
        const deadlineStr = `${body.fiscalYear}-${reportDeadlines[reportType]}`
        return prisma.scheduledReport.upsert({
          where: {
            reportType_fiscalYear: {
              reportType,
              fiscalYear: body.fiscalYear,
            },
          },
          create: {
            reportType,
            fiscalYear: body.fiscalYear,
            deadline: new Date(deadlineStr),
          },
          update: {},
        })
      }),
    )

    return ok(results)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/immigration/reports — 定期報告の個別更新（ID を body で指定） */
export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const raw = await request.json()
    const id = z.string().uuid().parse(raw.id)
    const body = updateReportSchema.parse(raw)

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) {
      data.status = body.status
      /* 完了時に completedAt を自動設定 */
      if (body.status === 'DONE' && !body.completedAt) {
        data.completedAt = new Date()
      }
    }
    if (body.completedAt !== undefined) {
      data.completedAt = body.completedAt ? new Date(body.completedAt) : null
    }
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await prisma.scheduledReport.update({
      where: { id },
      data,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
