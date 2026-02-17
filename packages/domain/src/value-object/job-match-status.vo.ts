import { z } from 'zod'

/** マッチングステータスの値 */
const values = [
  'CANDIDATE',
  'RECOMMENDED',
  'INTERVIEWING',
  'OFFERED',
  'DECLINED',
  'REJECTED',
] as const

const schema = z.enum(values)

type JobMatchStatus = z.infer<typeof schema>

/** マッチングステータスの日本語ラベル */
const labelMap: Record<JobMatchStatus, string> = {
  CANDIDATE: '候補',
  RECOMMENDED: '推薦中',
  INTERVIEWING: '面接中',
  OFFERED: '内定',
  DECLINED: '辞退',
  REJECTED: '不合格',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as JobMatchStatus,
  label,
}))

export const jobMatchStatus = { values, schema, labelMap, options }
export type { JobMatchStatus }
