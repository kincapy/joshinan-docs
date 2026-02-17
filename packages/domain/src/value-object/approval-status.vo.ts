import { z } from 'zod'

/** 決裁ステータスの値 */
const values = ['PENDING', 'APPROVED', 'REJECTED'] as const

const schema = z.enum(values)

type ApprovalStatus = z.infer<typeof schema>

/** 決裁ステータスの日本語ラベル */
const labelMap: Record<ApprovalStatus, string> = {
  PENDING: '承認待ち',
  APPROVED: '承認済み',
  REJECTED: '却下',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ApprovalStatus,
  label,
}))

export const approvalStatus = { values, schema, labelMap, options }
export type { ApprovalStatus }
