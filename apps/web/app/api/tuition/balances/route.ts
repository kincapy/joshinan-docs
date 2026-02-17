import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/** 当月を YYYY-MM 形式で返す */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** GET /api/tuition/balances -- 学生別残高一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ?? getCurrentMonth()
    const balanceStatus = searchParams.get('balanceStatus') ?? 'all'
    const cohort = searchParams.get('cohort')
    const nationality = searchParams.get('nationality')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 50

    // MonthlyBalance のフィルタ条件
    const balanceWhere: Record<string, unknown> = { month }
    if (balanceStatus === 'receivable') {
      balanceWhere.balance = { gt: 0 }
    } else if (balanceStatus === 'overpaid') {
      balanceWhere.balance = { lt: 0 }
    }

    // 学生のフィルタ条件
    const studentWhere: Record<string, unknown> = {}
    if (cohort) studentWhere.cohort = cohort
    if (nationality) studentWhere.nationality = nationality

    // 学生フィルタがある場合は student 条件を追加
    if (Object.keys(studentWhere).length > 0) {
      balanceWhere.student = studentWhere
    }

    const [balances, total] = await Promise.all([
      prisma.monthlyBalance.findMany({
        where: balanceWhere,
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              nameKanji: true,
              nameEn: true,
              nationality: true,
              cohort: true,
            },
          },
        },
        orderBy: { balance: 'desc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.monthlyBalance.count({ where: balanceWhere }),
    ])

    // 各学生の最終入金日を取得
    const studentIds = balances.map((b) => b.studentId)
    const lastPayments = await getLastPaymentDates(studentIds)

    // 残高データに最終入金日を付与
    const data = balances.map((b) => ({
      ...b,
      lastPaymentDate: lastPayments.get(b.studentId) ?? null,
    }))

    return okList(data, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** 学生IDリストの最終入金日を取得する */
async function getLastPaymentDates(
  studentIds: string[],
): Promise<Map<string, Date>> {
  if (studentIds.length === 0) return new Map()

  // 各学生の最新入金を取得
  const payments = await prisma.payment.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, paymentDate: true },
    orderBy: { paymentDate: 'desc' },
    distinct: ['studentId'],
  })

  const map = new Map<string, Date>()
  for (const p of payments) {
    map.set(p.studentId, p.paymentDate)
  }
  return map
}
