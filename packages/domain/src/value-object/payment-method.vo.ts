import { z } from 'zod'

/** 入金方法の値 */
const values = ['CASH', 'BANK_TRANSFER'] as const

const schema = z.enum(values)

type PaymentMethod = z.infer<typeof schema>

/** 入金方法の日本語ラベル */
const labelMap: Record<PaymentMethod, string> = {
  CASH: '現金',
  BANK_TRANSFER: '銀行振込',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as PaymentMethod,
  label,
}))

export const paymentMethod = { values, schema, labelMap, options }
export type { PaymentMethod }
