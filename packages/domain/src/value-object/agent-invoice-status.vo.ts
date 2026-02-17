import { z } from 'zod'

/** エージェント請求書ステータスの値 */
const values = ['UNPAID', 'PARTIAL', 'PAID'] as const

const schema = z.enum(values)

type AgentInvoiceStatus = z.infer<typeof schema>

/** エージェント請求書ステータスの日本語ラベル */
const labelMap: Record<AgentInvoiceStatus, string> = {
  UNPAID: '未払い',
  PARTIAL: '一部支払い済み',
  PAID: '支払い完了',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AgentInvoiceStatus,
  label,
}))

export const agentInvoiceStatus = { values, schema, labelMap, options }
export type { AgentInvoiceStatus }
