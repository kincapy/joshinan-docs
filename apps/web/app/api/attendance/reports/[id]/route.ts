import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
/** 報告状態の値 */
const reportStatusValues = ['PENDING', 'SUBMITTED'] as const

/** 報告状態更新のスキーマ */
const updateReportSchema = z.object({
  reportStatus: z.enum(reportStatusValues),
})

/**
 * GET /api/attendance/reports/:id — 半期報告詳細
 * 対象期間の全学生の月次出席率を含む
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()

    const { id } = await params

    const report = await prisma.semiannualAttendanceReport.findUnique({
      where: { id },
    })

    if (!report) {
      return errorResponse('報告データが見つかりません', 404)
    }

    // 対象期間の月リストを生成
    const months = getTermMonths(report.term, report.fiscalYear)

    // 全学生の月次出席率（学生情報付き）
    const monthlyRates = await prisma.monthlyAttendanceRate.findMany({
      where: { month: { in: months } },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            nameKanji: true,
            nameEn: true,
          },
        },
      },
      orderBy: [
        { student: { studentNumber: 'asc' } },
        { month: 'asc' },
      ],
    })

    return ok({ report, monthlyRates })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/attendance/reports/:id — 報告状態更新
 * 提出済みにする場合は reportedAt も記録
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()

    const { id } = await params
    const body = await parseBody(request, updateReportSchema)

    const updateData: Record<string, unknown> = {
      reportStatus: body.reportStatus,
    }

    // 提出済みにする場合は reportedAt を記録
    if (body.reportStatus === 'SUBMITTED') {
      updateData.reportedAt = new Date()
    } else {
      // PENDING に戻す場合は reportedAt をクリア
      updateData.reportedAt = null
    }

    const updated = await prisma.semiannualAttendanceReport.update({
      where: { id },
      data: updateData,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

/** 期間に応じた月リストを返す */
function getTermMonths(
  term: 'FIRST_HALF' | 'SECOND_HALF',
  fiscalYear: number,
): string[] {
  if (term === 'FIRST_HALF') {
    return Array.from({ length: 6 }, (_, i) => {
      const m = i + 4
      return `${fiscalYear}-${String(m).padStart(2, '0')}`
    })
  }
  return Array.from({ length: 6 }, (_, i) => {
    const m = i + 10
    if (m <= 12) {
      return `${fiscalYear}-${String(m).padStart(2, '0')}`
    }
    return `${fiscalYear + 1}-${String(m - 12).padStart(2, '0')}`
  })
}
