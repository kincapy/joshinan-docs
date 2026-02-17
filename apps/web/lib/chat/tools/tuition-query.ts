import { prisma } from '@/lib/prisma'

/**
 * 学費・未納情報検索の Tool Use ハンドラ
 *
 * Claude が「未納者一覧」等を聞かれた時に呼ばれる
 */
export async function searchTuition(
  input: Record<string, unknown>
): Promise<string> {
  const where: Record<string, unknown> = {}

  // 学生IDフィルタ
  if (input.studentId) {
    where.studentId = String(input.studentId)
  }

  // 未納のみフィルタ（balance > 0 は未払い残高あり）
  if (input.unpaidOnly) {
    where.balance = { gt: 0 }
  }

  // 年月フィルタ（DB カラム名は month）
  if (input.yearMonth) {
    where.month = String(input.yearMonth)
  }

  const balances = await prisma.monthlyBalance.findMany({
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
    orderBy: [{ month: 'desc' }, { balance: 'desc' }],
    take: 50,
  })

  const result = balances.map((b) => ({
    studentId: b.student.id,
    studentName: b.student.nameKanji ?? b.student.nameEn,
    nationality: b.student.nationality,
    yearMonth: b.month,
    monthlyCharge: Number(b.monthlyCharge),
    monthlyPayment: Number(b.monthlyPayment),
    balance: Number(b.balance),
  }))

  return JSON.stringify({
    count: result.length,
    balances: result,
  })
}
