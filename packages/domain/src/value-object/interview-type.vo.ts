import { z } from 'zod'

/** 面談種別の値 */
const values = ['CAREER', 'ATTENDANCE', 'LIFE_GUIDANCE', 'OTHER'] as const

const schema = z.enum(values)

type InterviewType = z.infer<typeof schema>

/** 面談種別の日本語ラベル */
const labelMap: Record<InterviewType, string> = {
  CAREER: '進路相談',
  ATTENDANCE: '出席指導',
  LIFE_GUIDANCE: '生活指導',
  OTHER: 'その他',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as InterviewType,
  label,
}))

export const interviewType = { values, schema, labelMap, options }
export type { InterviewType }
