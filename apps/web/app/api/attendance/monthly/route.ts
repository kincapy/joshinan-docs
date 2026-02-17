import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/**
 * GET /api/attendance/monthly — 出席ダッシュボード用データ
 * query:
 *   month: YYYY-MM（デフォルト: 当月）
 *   alertOnly: "true" でアラート対象のみ
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const month =
      searchParams.get('month') ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const alertOnly = searchParams.get('alertOnly') === 'true'

    // 月次出席率の条件
    const where: Record<string, unknown> = { month }
    if (alertOnly) {
      where.alertLevel = { in: ['GUIDANCE_REQUIRED', 'REPORT_REQUIRED'] }
    }

    // 月次出席率一覧（学生情報付き）
    const monthlyRates = await prisma.monthlyAttendanceRate.findMany({
      where,
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
      orderBy: { rate: 'asc' },
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

    // クラス別出席率
    const classRates = await getClassRates(month)

    return ok({
      month,
      overallRate,
      studentCount: monthlyRates.length,
      alertCount: monthlyRates.filter(
        (r) => r.alertLevel !== 'NORMAL',
      ).length,
      monthlyRates,
      classRates,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** クラス別の月次出席率を計算 */
async function getClassRates(month: string) {
  // 開講中のクラスを取得
  const classes = await prisma.class.findMany({
    where: { isSubClass: false },
    select: {
      id: true,
      name: true,
      classEnrollments: {
        where: { endDate: null },
        select: { studentId: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const results = []
  for (const cls of classes) {
    const studentIds = cls.classEnrollments.map((e) => e.studentId)
    if (studentIds.length === 0) continue

    // クラスに属する学生の月次出席率を集計
    const rates = await prisma.monthlyAttendanceRate.findMany({
      where: {
        studentId: { in: studentIds },
        month,
      },
    })

    if (rates.length === 0) continue

    const totalRequired = rates.reduce((sum, r) => sum + r.requiredHours, 0)
    const totalAttended = rates.reduce((sum, r) => sum + r.attendedHours, 0)
    const totalLateAsAbsence = rates.reduce(
      (sum, r) => sum + r.lateAsAbsence,
      0,
    )
    const avgRate =
      totalRequired > 0
        ? (totalAttended - totalLateAsAbsence) / totalRequired
        : 0

    results.push({
      classId: cls.id,
      className: cls.name,
      studentCount: studentIds.length,
      averageRate: avgRate,
    })
  }

  return results
}
