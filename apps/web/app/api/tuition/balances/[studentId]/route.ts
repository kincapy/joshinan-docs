import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

type RouteParams = { params: Promise<{ studentId: string }> }

/** GET /api/tuition/balances/:studentId -- 学生別残高詳細 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { studentId } = await params

    // 並列で全データを取得
    const [student, balanceHistory, invoices, payments] =
      await Promise.all([
        getStudent(studentId),
        getBalanceHistory(studentId),
        getInvoices(studentId),
        getPayments(studentId),
      ])

    return ok({ student, balanceHistory, invoices, payments })
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── ヘルパー関数 ──────────────────────────────

/** 学生基本情報を取得 */
async function getStudent(studentId: string) {
  return prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      id: true,
      studentNumber: true,
      nameKanji: true,
      nameEn: true,
      nationality: true,
      cohort: true,
      status: true,
    },
  })
}

/** 月次残高推移を取得（月昇順） */
async function getBalanceHistory(studentId: string) {
  return prisma.monthlyBalance.findMany({
    where: { studentId },
    orderBy: { month: 'asc' },
  })
}

/** 全請求を取得（品目名含む、billingMonth 降順） */
async function getInvoices(studentId: string) {
  return prisma.invoice.findMany({
    where: { studentId },
    include: { billingItem: { select: { name: true } } },
    orderBy: { billingMonth: 'desc' },
  })
}

/** 全入金を取得（paymentDate 降順） */
async function getPayments(studentId: string) {
  return prisma.payment.findMany({
    where: { studentId },
    orderBy: { paymentDate: 'desc' },
  })
}
