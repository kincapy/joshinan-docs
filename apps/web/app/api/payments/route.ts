import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 入金方法の許容値 */
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER'] as const

/** 入金登録のバリデーションスキーマ */
const createPaymentSchema = z.object({
  studentId: z.string().uuid('学生IDが不正です'),
  paymentDate: z.string().min(1, '入金日は必須です'),
  amount: z.number().positive('金額は正の数を指定してください'),
  method: z.enum(PAYMENT_METHODS, { message: '入金方法が不正です' }),
  notes: z.string().nullable().optional(),
})

/** GET /api/payments -- 入金一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId

    const payments = await prisma.payment.findMany({
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
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    return ok(payments)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/payments -- 入金登録 + 自動消込 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createPaymentSchema)

    // 入金レコードを作成
    const payment = await prisma.payment.create({
      data: {
        studentId: body.studentId,
        paymentDate: new Date(body.paymentDate),
        amount: body.amount,
        method: body.method,
        notes: body.notes ?? null,
      },
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
    })

    // 入金消込: 未決済の請求を古い順に消し込む
    await reconcileInvoices(body.studentId, body.amount)

    // 対象月の MonthlyBalance を再計算
    const paymentMonth = body.paymentDate.substring(0, 7) // YYYY-MM
    await recalculateBalance(body.studentId, paymentMonth)

    return ok(payment)
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── ヘルパー関数 ──────────────────────────────

/**
 * 入金消込: 学生の未決済請求を古い月から順に消し込む
 * 入金額が請求額を完全にカバーしたら SETTLED に更新
 */
async function reconcileInvoices(
  studentId: string,
  paymentAmount: number,
) {
  // 未決済の請求を billingMonth 昇順で取得
  const openInvoices = await prisma.invoice.findMany({
    where: { studentId, status: 'ISSUED' },
    orderBy: { billingMonth: 'asc' },
  })

  let remaining = paymentAmount

  for (const invoice of openInvoices) {
    if (remaining <= 0) break

    const invoiceAmount = Number(invoice.amount)

    // 入金残高で請求額を完全にカバーできる場合のみ消込
    if (remaining >= invoiceAmount) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'SETTLED' },
      })
      remaining -= invoiceAmount
    } else {
      // 部分的な入金の場合はステータスを変更しない（余剰は次回に持ち越し）
      break
    }
  }
}

/**
 * 学生の対象月の MonthlyBalance を再計算する
 * 前月末残高 + 当月請求額 - 当月入金額 = 当月末残高
 */
async function recalculateBalance(
  studentId: string,
  month: string,
) {
  const prevMonth = getPreviousMonth(month)

  // 前月の残高を取得（なければ 0）
  const prevBalance = await prisma.monthlyBalance.findUnique({
    where: { studentId_month: { studentId, month: prevMonth } },
  })
  const previousBalance = prevBalance ? Number(prevBalance.balance) : 0

  // 当月の請求合計
  const chargeResult = await prisma.invoice.aggregate({
    where: { studentId, billingMonth: month },
    _sum: { amount: true },
  })
  const monthlyCharge = Number(chargeResult._sum.amount ?? 0)

  // 当月の入金合計（paymentDate が対象月内）
  const monthStart = new Date(`${month}-01`)
  const nextMonthDate = getNextMonthDate(month)
  const paymentResult = await prisma.payment.aggregate({
    where: {
      studentId,
      paymentDate: { gte: monthStart, lt: nextMonthDate },
    },
    _sum: { amount: true },
  })
  const monthlyPayment = Number(paymentResult._sum.amount ?? 0)

  const balance = previousBalance + monthlyCharge - monthlyPayment

  await prisma.monthlyBalance.upsert({
    where: { studentId_month: { studentId, month } },
    create: {
      studentId,
      month,
      previousBalance,
      monthlyCharge,
      monthlyPayment,
      balance,
    },
    update: {
      previousBalance,
      monthlyCharge,
      monthlyPayment,
      balance,
    },
  })
}

/** YYYY-MM 形式の前月を返す */
function getPreviousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  if (m === 1) return `${year - 1}-12`
  return `${year}-${String(m - 1).padStart(2, '0')}`
}

/** YYYY-MM 形式の翌月1日を Date で返す */
function getNextMonthDate(month: string): Date {
  const [year, m] = month.split('-').map(Number)
  if (m === 12) return new Date(`${year + 1}-01-01`)
  return new Date(`${year}-${String(m + 1).padStart(2, '0')}-01`)
}
