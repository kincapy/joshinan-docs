import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/** 当月を YYYY-MM 形式で返す */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** GET /api/tuition/dashboard -- 学費管理ダッシュボード */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ?? getCurrentMonth()

    // 並列で全データを取得
    const [
      receivableSummary,
      overpaidSummary,
      monthlySales,
      recentPayments,
    ] = await Promise.all([
      getReceivableSummary(month),
      getOverpaidSummary(month),
      getMonthlySales(month),
      getRecentPayments(),
    ])

    return ok({
      month,
      receivableSummary,
      overpaidSummary,
      monthlySales,
      recentPayments,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── ヘルパー関数 ──────────────────────────────

/** 未収金サマリー: balance > 0 の学生数・合計金額 */
async function getReceivableSummary(month: string) {
  const result = await prisma.monthlyBalance.aggregate({
    where: { month, balance: { gt: 0 } },
    _count: { studentId: true },
    _sum: { balance: true },
  })
  return {
    studentCount: result._count.studentId,
    totalAmount: Number(result._sum.balance ?? 0),
  }
}

/** 過払いサマリー: balance < 0 の学生数・合計金額 */
async function getOverpaidSummary(month: string) {
  const result = await prisma.monthlyBalance.aggregate({
    where: { month, balance: { lt: 0 } },
    _count: { studentId: true },
    _sum: { balance: true },
  })
  return {
    studentCount: result._count.studentId,
    totalAmount: Number(result._sum.balance ?? 0),
  }
}

/** 当月の品目別売上（SETTLED の請求を品目ごとに集計） */
async function getMonthlySales(month: string) {
  const invoices = await prisma.invoice.findMany({
    where: { billingMonth: month, status: 'SETTLED' },
    include: { billingItem: { select: { name: true } } },
  })

  // 品目名でグルーピングして集計
  const salesMap = new Map<string, { amount: number; count: number }>()

  for (const inv of invoices) {
    const name = inv.billingItem.name
    const current = salesMap.get(name) ?? { amount: 0, count: 0 }
    current.amount += Number(inv.amount)
    current.count += 1
    salesMap.set(name, current)
  }

  return Array.from(salesMap.entries()).map(([itemName, data]) => ({
    itemName,
    amount: data.amount,
    count: data.count,
  }))
}

/** 直近5件の入金（学生情報含む） */
async function getRecentPayments() {
  return prisma.payment.findMany({
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
    orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    take: 5,
  })
}
