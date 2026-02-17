import { z } from 'zod'

/** 求人ステータスの値 */
const values = ['OPEN', 'CLOSED', 'FILLED'] as const

const schema = z.enum(values)

type JobPostingStatus = z.infer<typeof schema>

/** 求人ステータスの日本語ラベル */
const labelMap: Record<JobPostingStatus, string> = {
  OPEN: '募集中',
  CLOSED: '募集終了',
  FILLED: '充足',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as JobPostingStatus,
  label,
}))

export const jobPostingStatus = { values, schema, labelMap, options }
export type { JobPostingStatus }
