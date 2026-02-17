import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 支払い登録のバリデーションスキーマ */
const createPaymentSchema = z.object({
  agentInvoiceId: z.string().uuid('有効な請求書IDを指定してください'),
  paymentDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
  amount: z.number().positive('金額は正の数を入力してください'),
  notes: z.string().nullable().optional(),
})

/**
 * 支払番号の自動採番
 * PAY-001, PAY-002, ... の形式
 */
async function generatePaymentNumber(): Promise<string> {
  const lastPayment = await prisma.agentPayment.findFirst({
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  })

  if (!lastPayment) return 'PAY-001'

  const lastNum = parseInt(lastPayment.paymentNumber.replace('PAY-', ''), 10)
  return `PAY-${String(lastNum + 1).padStart(3, '0')}`
}

/** GET /api/agents/:id/payments — 支払い一覧 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    // エージェントに紐づく全請求書の支払いを取得
    const payments = await prisma.agentPayment.findMany({
      where: {
        agentInvoice: { agentId: id },
      },
      orderBy: { paymentDate: 'desc' },
      include: {
        agentInvoice: {
          select: { invoiceNumber: true, amount: true },
        },
      },
    })

    return ok(payments)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/agents/:id/payments — 支払い登録
 * 支払い後、対象請求書のステータスを自動更新する
 * - 全額支払い完了 → PAID
 * - 一部支払い → PARTIAL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, createPaymentSchema)

    // 対象請求書がこのエージェントに属するか確認
    const invoice = await prisma.agentInvoice.findFirstOrThrow({
      where: { id: body.agentInvoiceId, agentId: id },
      include: { payments: true },
    })

    const paymentNumber = await generatePaymentNumber()

    // 支払いレコードを作成
    const payment = await prisma.agentPayment.create({
      data: {
        paymentNumber,
        agentInvoiceId: body.agentInvoiceId,
        paymentDate: new Date(body.paymentDate),
        amount: body.amount,
        notes: body.notes ?? null,
      },
    })

    // 請求書のステータスを再計算して更新
    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount), 0,
    ) + body.amount

    const invoiceAmount = Number(invoice.amount)
    const newStatus = totalPaid >= invoiceAmount ? 'PAID' : 'PARTIAL'

    await prisma.agentInvoice.update({
      where: { id: body.agentInvoiceId },
      data: { status: newStatus },
    })

    return ok(payment)
  } catch (error) {
    return handleApiError(error)
  }
}
