import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/**
 * GET /api/attendance/monthly/:studentId — 学生別月次出席率推移
 * 在籍期間の全月次出席率を返す
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    await requireAuth()

    const { studentId } = await params

    // 学生の存在確認
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentNumber: true,
        nameKanji: true,
        nameEn: true,
      },
    })

    if (!student) {
      return errorResponse('学生が見つかりません', 404)
    }

    // 月次出席率の推移（古い順）
    const monthlyRates = await prisma.monthlyAttendanceRate.findMany({
      where: { studentId },
      orderBy: { month: 'asc' },
    })

    // 出欠記録の詳細（直近3ヶ月分）
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    threeMonthsAgo.setDate(1)

    const recentRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: { gte: threeMonthsAgo },
      },
      orderBy: [{ date: 'desc' }, { period: 'asc' }],
    })

    return ok({
      student,
      monthlyRates,
      recentRecords,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
