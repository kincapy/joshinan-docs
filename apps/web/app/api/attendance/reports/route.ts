import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 出席率報告期間の値 */
const attendanceTermValues = ['FIRST_HALF', 'SECOND_HALF'] as const

/** 半期報告生成のスキーマ */
const generateReportSchema = z.object({
  term: z.enum(attendanceTermValues),
  fiscalYear: z.number().int().min(2000).max(2100),
})

/**
 * GET /api/attendance/reports — 半期報告一覧
 * query: fiscalYear（オプション）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscalYear')

    const where: { fiscalYear?: number } = {}
    if (fiscalYear) where.fiscalYear = Number(fiscalYear)

    const reports = await prisma.semiannualAttendanceReport.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { term: 'asc' }],
    })

    return ok(reports)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/attendance/reports — 半期報告を生成
 * 対象期間の全学生の出席率を集計し、報告データを作成
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, generateReportSchema)

    // 対象期間の月リストを生成
    const months = getTermMonths(body.term, body.fiscalYear)

    // 全学生の対象期間の月次出席率を集計
    const monthlyRates = await prisma.monthlyAttendanceRate.findMany({
      where: { month: { in: months } },
    })

    // 全体出席率の計算
    let overallRate = 0
    if (monthlyRates.length > 0) {
      const totalRequired = monthlyRates.reduce(
        (sum, r) => sum + r.requiredHours,
        0,
      )
      const totalAttended = monthlyRates.reduce(
        (sum, r) => sum + r.attendedHours,
        0,
      )
      const totalLateAsAbsence = monthlyRates.reduce(
        (sum, r) => sum + r.lateAsAbsence,
        0,
      )
      overallRate =
        totalRequired > 0
          ? (totalAttended - totalLateAsAbsence) / totalRequired
          : 0
    }

    // 報告期限の計算（前期→12月末、後期→6月末）
    const deadline = getDeadline(body.term, body.fiscalYear)

    // 既存の報告を検索し、あれば更新・なければ作成
    const existing = await prisma.semiannualAttendanceReport.findFirst({
      where: { term: body.term, fiscalYear: body.fiscalYear },
    })

    let report
    if (existing) {
      report = await prisma.semiannualAttendanceReport.update({
        where: { id: existing.id },
        data: {
          overallRate,
          deadline: new Date(deadline),
        },
      })
    } else {
      report = await prisma.semiannualAttendanceReport.create({
        data: {
          term: body.term,
          fiscalYear: body.fiscalYear,
          overallRate,
          deadline: new Date(deadline),
          reportStatus: 'PENDING',
        },
      })
    }

    return ok(report)
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
    // 前期: 4月〜9月
    return Array.from({ length: 6 }, (_, i) => {
      const m = i + 4
      return `${fiscalYear}-${String(m).padStart(2, '0')}`
    })
  }
  // 後期: 10月〜翌年3月
  return Array.from({ length: 6 }, (_, i) => {
    const m = i + 10
    if (m <= 12) {
      return `${fiscalYear}-${String(m).padStart(2, '0')}`
    }
    return `${fiscalYear + 1}-${String(m - 12).padStart(2, '0')}`
  })
}

/** 報告期限を計算 */
function getDeadline(
  term: 'FIRST_HALF' | 'SECOND_HALF',
  fiscalYear: number,
): string {
  if (term === 'FIRST_HALF') {
    // 前期の報告期限: 同年12月末
    return `${fiscalYear}-12-31`
  }
  // 後期の報告期限: 翌年6月末
  return `${fiscalYear + 1}-06-30`
}
