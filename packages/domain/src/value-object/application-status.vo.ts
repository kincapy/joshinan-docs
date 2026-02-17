import { z } from 'zod'

/** 申請ステータスの値 */
const values = [
  'PREPARING',
  'SUBMITTED',
  'GRANTED',
  'DENIED',
  'WITHDRAWN',
] as const

const schema = z.enum(values)

type ApplicationStatus = z.infer<typeof schema>

/** 申請ステータスの日本語ラベル */
const labelMap: Record<ApplicationStatus, string> = {
  PREPARING: '書類準備中',
  SUBMITTED: '申請済',
  GRANTED: '交付',
  DENIED: '不交付',
  WITHDRAWN: '取下',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ApplicationStatus,
  label,
}))

export const applicationStatus = { values, schema, labelMap, options }
export type { ApplicationStatus }
