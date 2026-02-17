import { z } from 'zod'

/** 決裁種別の値 */
const values = ['DATA_CHANGE', 'KNOWLEDGE_UPDATE'] as const

const schema = z.enum(values)

type ApprovalType = z.infer<typeof schema>

/** 決裁種別の日本語ラベル */
const labelMap: Record<ApprovalType, string> = {
  DATA_CHANGE: 'データ変更',
  KNOWLEDGE_UPDATE: 'ナレッジ更新',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ApprovalType,
  label,
}))

export const approvalType = { values, schema, labelMap, options }
export type { ApprovalType }
