import { z } from 'zod'

/** 入学前詳細ステータスの値 */
const values = [
  'APPLICATION_PLANNED',
  'GRANTED',
  'NOT_GRANTED',
  'DECLINED',
] as const

const schema = z.enum(values)

type PreEnrollmentStatus = z.infer<typeof schema>

/** 入学前詳細ステータスの日本語ラベル */
const labelMap: Record<PreEnrollmentStatus, string> = {
  APPLICATION_PLANNED: '申請予定',
  GRANTED: '入学予定',
  NOT_GRANTED: '不交付',
  DECLINED: '入学辞退',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as PreEnrollmentStatus,
  label,
}))

export const preEnrollmentStatus = { values, schema, labelMap, options }
export type { PreEnrollmentStatus }
