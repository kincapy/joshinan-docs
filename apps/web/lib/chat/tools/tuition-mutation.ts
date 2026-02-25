import { prisma } from '@/lib/prisma'
import { writeAuditLogs, type ToolContext } from './audit-log'

/** 入金方法の日本語→enum マッピング */
const PAYMENT_METHOD_MAP: Record<string, string> = {
  現金: 'CASH',
  振込: 'BANK_TRANSFER',
  銀行振込: 'BANK_TRANSFER',
}

const VALID_METHODS = ['CASH', 'BANK_TRANSFER'] as const

/**
 * 入金方法を正規化する
 */
function normalizeMethod(raw: string): string | null {
  const upper = raw.toUpperCase()
  if (VALID_METHODS.includes(upper as (typeof VALID_METHODS)[number])) {
    return upper
  }
  return PAYMENT_METHOD_MAP[raw] ?? null
}

/**
 * 学費入金記録の Tool Use ハンドラ
 *
 * Claude が「田中さんの学費5万円を現金で入金」等を指示された時に呼ばれる
 * Payment テーブルに INSERT し、AuditLog に記録する
 */
export async function recordPayment(
  input: Record<string, unknown>,
  context?: ToolContext,
): Promise<string> {
  // バリデーション
  const studentId = String(input.studentId ?? '')
  if (!studentId) {
    return JSON.stringify({ error: '学生IDは必須です' })
  }

  const paymentDateStr = String(input.paymentDate ?? '')
  if (!paymentDateStr) {
    return JSON.stringify({ error: '入金日は必須です' })
  }
  const paymentDate = new Date(paymentDateStr)
  if (isNaN(paymentDate.getTime())) {
    return JSON.stringify({ error: `入金日の形式が正しくありません: ${paymentDateStr}` })
  }

  const amount = Number(input.amount)
  if (!amount || amount <= 0) {
    return JSON.stringify({ error: '入金額は0より大きい値を指定してください' })
  }

  const methodRaw = String(input.method ?? '')
  const method = normalizeMethod(methodRaw)
  if (!method) {
    return JSON.stringify({ error: `入金方法が正しくありません: ${methodRaw}（CASH または BANK_TRANSFER）` })
  }

  // 学生の存在確認
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, nameKanji: true, nameEn: true },
  })
  if (!student) {
    return JSON.stringify({ error: '学生が見つかりません', studentId })
  }

  // 請求IDの存在確認（指定された場合）
  const invoiceId = input.invoiceId ? String(input.invoiceId) : null
  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })
    if (!invoice) {
      return JSON.stringify({ error: '指定された請求が見つかりません', invoiceId })
    }
  }

  // Payment を INSERT
  const payment = await prisma.payment.create({
    data: {
      studentId,
      paymentDate,
      amount,
      method: method as 'CASH' | 'BANK_TRANSFER',
      invoiceId,
      notes: input.notes ? String(input.notes) : null,
    },
  })

  // AuditLog を記録
  if (context) {
    await writeAuditLogs(context, [
      {
        action: 'CREATE',
        tableName: 'payments',
        recordId: payment.id,
        oldValue: null,
        newValue: {
          studentId,
          paymentDate: paymentDateStr,
          amount,
          method,
          invoiceId,
          notes: input.notes ?? null,
        },
      },
    ])
  }

  const methodLabel = method === 'CASH' ? '現金' : '銀行振込'

  return JSON.stringify({
    success: true,
    paymentId: payment.id,
    studentName: student.nameKanji ?? student.nameEn,
    paymentDate: paymentDateStr,
    amount,
    method: methodLabel,
    invoiceId,
  })
}
