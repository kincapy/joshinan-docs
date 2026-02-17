import { z } from 'zod'

/** 進路合否の値 */
const values = ['PENDING', 'ACCEPTED', 'REJECTED'] as const

const schema = z.enum(values)

type CareerResult = z.infer<typeof schema>

/** 進路合否の日本語ラベル */
const labelMap: Record<CareerResult, string> = {
  PENDING: '未定',
  ACCEPTED: '合格',
  REJECTED: '不合格',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CareerResult,
  label,
}))

export const careerResult = { values, schema, labelMap, options }
export type { CareerResult }
