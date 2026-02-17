import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** YYYY-MM 形式のバリデーション */
const billingMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/** 一括請求生成のバリデーションスキーマ */
const createInvoicesSchema = z.object({
  billingMonth: z.string().regex(billingMonthRegex, 'YYYY-MM形式で指定してください'),
  studentIds: z.union([
    z.literal('all'),
    z.array(z.string().uuid()),
  ]),
})

/** 3月・8月は「学費」品目を除外する（長期休暇月の特殊ルール） */
const TUITION_EXEMPT_MONTHS = ['03', '08']
const TUITION_ITEM_NAME = '学費'

/** GET /api/invoices -- 請求一覧（学生ID必須） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const billingMonth = searchParams.get('billingMonth')

    if (!studentId) {
      return ok([])
    }

    const where: Record<string, unknown> = { studentId }
    if (billingMonth) where.billingMonth = billingMonth

    const invoices = await prisma.invoice.findMany({
      where,
      include: { billingItem: true },
      orderBy: { billingMonth: 'desc' },
    })

    return ok(invoices)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/invoices -- 月次一括請求生成 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createInvoicesSchema)

    const { billingMonth, studentIds } = body
    const month = billingMonth.split('-')[1] // "03", "08" 等

    // 対象学生を取得（"all" の場合は在学中の全学生）
    const students = await fetchTargetStudents(studentIds)
    if (students.length === 0) return ok({ created: 0 })

    // 有効かつ単価ありの品目を取得（3月・8月は学費を除外）
    const items = await fetchBillingItems(month)
    if (items.length === 0) return ok({ created: 0 })

    // 学生 x 品目の組み合わせで請求レコードを一括作成
    const invoiceData = students.flatMap((s) =>
      items.map((item) => ({
        studentId: s.id,
        billingItemId: item.id,
        billingMonth,
        amount: item.unitPrice!,
        status: 'ISSUED' as const,
      })),
    )

    await prisma.invoice.createMany({ data: invoiceData })

    // 各学生の MonthlyBalance を再計算
    for (const student of students) {
      await recalculateBalance(student.id, billingMonth)
    }

    return ok({ created: invoiceData.length })
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── ヘルパー関数 ──────────────────────────────

/** 対象学生を取得する。"all" の場合は在学中の全学生 */
async function fetchTargetStudents(
  studentIds: string[] | 'all',
) {
  if (studentIds === 'all') {
    return prisma.student.findMany({
      where: { status: 'ENROLLED' },
      select: { id: true },
    })
  }
  return prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true },
  })
}

/** 有効な品目を取得する。3月・8月は学費品目を除外 */
async function fetchBillingItems(month: string) {
  const isExemptMonth = TUITION_EXEMPT_MONTHS.includes(month)

  return prisma.billingItem.findMany({
    where: {
      isActive: true,
      unitPrice: { not: null },
      // 3月・8月は「学費」品目を除外
      ...(isExemptMonth ? { name: { not: TUITION_ITEM_NAME } } : {}),
    },
    orderBy: { displayOrder: 'asc' },
  })
}

/**
 * 学生の対象月の MonthlyBalance を再計算する
 * 前月末残高 + 当月請求額 - 当月入金額 = 当月末残高
 */
export async function recalculateBalance(
  studentId: string,
  month: string,
) {
  // 前月を算出（YYYY-MM 形式）
  const prevMonth = getPreviousMonth(month)

  // 前月の残高を取得（なければ 0）
  const prevBalance = await prisma.monthlyBalance.findUnique({
    where: { studentId_month: { studentId, month: prevMonth } },
  })
  const previousBalance = prevBalance ? Number(prevBalance.balance) : 0

  // 当月の請求合計を取得
  const chargeResult = await prisma.invoice.aggregate({
    where: { studentId, billingMonth: month },
    _sum: { amount: true },
  })
  const monthlyCharge = Number(chargeResult._sum.amount ?? 0)

  // 当月の入金合計を取得（paymentDate が対象月内のもの）
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

  // MonthlyBalance を upsert
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
