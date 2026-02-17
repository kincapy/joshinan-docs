import { z } from 'zod'

/** 進路区分の値 */
const values = ['FURTHER_EDUCATION', 'EMPLOYMENT', 'RETURN_HOME'] as const

const schema = z.enum(values)

type CareerPath = z.infer<typeof schema>

/** 進路区分の日本語ラベル */
const labelMap: Record<CareerPath, string> = {
  FURTHER_EDUCATION: '進学',
  EMPLOYMENT: '就職',
  RETURN_HOME: '帰国',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CareerPath,
  label,
}))

export const careerPath = { values, schema, labelMap, options }
export type { CareerPath }
