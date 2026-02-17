import { prisma } from '@/lib/prisma'

/**
 * 出席情報検索の Tool Use ハンドラ
 *
 * Claude が「先月の出席率」等を聞かれた時に呼ばれる
 */
export async function searchAttendance(
  input: Record<string, unknown>
): Promise<string> {
  const where: Record<string, unknown> = {}

  // 学生IDフィルタ
  if (input.studentId) {
    where.studentId = String(input.studentId)
  }

  // 年月フィルタ（DB カラム名は month）
  if (input.yearMonth) {
    where.month = String(input.yearMonth)
  }

  const records = await prisma.monthlyAttendanceRate.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          nameEn: true,
          nameKanji: true,
          nationality: true,
        },
      },
    },
    orderBy: [{ month: 'desc' }, { rate: 'asc' }],
    take: 50,
  })

  // 出席率上限フィルタ（rate は 0.0〜1.0 なのでパーセント換算して比較）
  let filtered = records
  if (input.maxRate !== undefined) {
    const maxRate = Number(input.maxRate) / 100
    filtered = records.filter((r) => r.rate <= maxRate)
  }

  const result = filtered.map((r) => ({
    studentId: r.student.id,
    studentName: r.student.nameKanji ?? r.student.nameEn,
    nationality: r.student.nationality,
    yearMonth: r.month,
    attendanceRate: Math.round(r.rate * 100),
    requiredHours: r.requiredHours,
    attendedHours: r.attendedHours,
    lateCount: r.lateCount,
    alertLevel: r.alertLevel,
  }))

  return JSON.stringify({
    count: result.length,
    records: result,
  })
}
