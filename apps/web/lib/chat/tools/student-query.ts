import { prisma } from '@/lib/prisma'

/**
 * 学生検索の Tool Use ハンドラ
 *
 * Claude が「出席率80%以下の学生」等を聞かれた時に呼ばれる
 */
export async function searchStudents(
  input: Record<string, unknown>
): Promise<string> {
  const where: Record<string, unknown> = {}

  // 名前フィルタ（nameEn で部分一致検索）
  if (input.name) {
    where.nameEn = { contains: String(input.name), mode: 'insensitive' }
  }

  // ステータスフィルタ
  if (input.status) {
    where.status = String(input.status)
  }

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      nameEn: true,
      nameKanji: true,
      nationality: true,
      status: true,
      monthlyAttendanceRates: {
        // 直近の出席率を取得（DB カラム名は month, rate）
        orderBy: { month: 'desc' },
        take: 1,
        select: {
          month: true,
          rate: true,
        },
      },
    },
    orderBy: { nameEn: 'asc' },
    take: 50,
  })

  // 出席率フィルタ（rate は 0.0〜1.0 なのでパーセント換算して比較）
  let filtered = students.map((s) => ({
    id: s.id,
    name: s.nameKanji ?? s.nameEn,
    nationality: s.nationality,
    status: s.status,
    attendanceRate:
      s.monthlyAttendanceRates[0] != null
        ? Math.round(s.monthlyAttendanceRates[0].rate * 100)
        : null,
    yearMonth: s.monthlyAttendanceRates[0]?.month ?? null,
  }))

  if (input.maxAttendanceRate !== undefined) {
    const maxRate = Number(input.maxAttendanceRate)
    filtered = filtered.filter(
      (s) => s.attendanceRate !== null && s.attendanceRate <= maxRate
    )
  }

  return JSON.stringify({
    count: filtered.length,
    students: filtered,
  })
}
