import { z } from 'zod'

/** 支援計画ステータスの値 */
const values = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const

const schema = z.enum(values)

type SupportPlanStatus = z.infer<typeof schema>

/** 支援計画ステータスの日本語ラベル */
const labelMap: Record<SupportPlanStatus, string> = {
  ACTIVE: '実施中',
  COMPLETED: '完了',
  CANCELLED: '取消',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as SupportPlanStatus,
  label,
}))

export const supportPlanStatus = { values, schema, labelMap, options }
export type { SupportPlanStatus }
