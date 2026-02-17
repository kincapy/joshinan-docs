import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 請求書登録のバリデーションスキーマ */
const createInvoiceSchema = z.object({
  invoiceDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
  amount: z.number().positive('金額は正の数を入力してください'),
  notes: z.string().nullable().optional(),
})

/**
 * 請求書番号の自動採番
 * INV-001, INV-002, ... の形式
 */
async function generateInvoiceNumber(): Promise<string> {
  const lastInvoice = await prisma.agentInvoice.findFirst({
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  })

  if (!lastInvoice) return 'INV-001'

  // INV-XXX から数値部分を抽出してインクリメント
  const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10)
  return `INV-${String(lastNum + 1).padStart(3, '0')}`
}

/** GET /api/agents/:id/invoices — 請求書一覧 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    const invoices = await prisma.agentInvoice.findMany({
      where: { agentId: id },
      orderBy: { invoiceDate: 'desc' },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })

    return ok(invoices)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/agents/:id/invoices — 請求書登録（番号自動採番） */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, createInvoiceSchema)

    // エージェントの存在確認
    await prisma.agent.findUniqueOrThrow({ where: { id } })

    const invoiceNumber = await generateInvoiceNumber()

    const invoice = await prisma.agentInvoice.create({
      data: {
        invoiceNumber,
        agentId: id,
        invoiceDate: new Date(body.invoiceDate),
        amount: body.amount,
        notes: body.notes ?? null,
      },
    })

    return ok(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}
