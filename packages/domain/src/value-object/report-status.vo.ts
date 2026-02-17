import { z } from 'zod'

/** 報告状態の値 */
const values = ['PENDING', 'SUBMITTED'] as const

const schema = z.enum(values)

type ReportStatus = z.infer<typeof schema>

/** 報告状態の日本語ラベル */
const labelMap: Record<ReportStatus, string> = {
  PENDING: '未提出',
  SUBMITTED: '提出済み',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ReportStatus,
  label,
}))

export const reportStatus = { values, schema, labelMap, options }
export type { ReportStatus }
