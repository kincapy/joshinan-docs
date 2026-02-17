import { z } from 'zod'

/** 請求ステータスの値 */
const values = ['ISSUED', 'SETTLED'] as const

const schema = z.enum(values)

type InvoiceStatus = z.infer<typeof schema>

/** 請求ステータスの日本語ラベル */
const labelMap: Record<InvoiceStatus, string> = {
  ISSUED: '請求書発行',
  SETTLED: '完了',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as InvoiceStatus,
  label,
}))

export const invoiceStatus = { values, schema, labelMap, options }
export type { InvoiceStatus }
