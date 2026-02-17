import { z } from 'zod'

/** 雇用形態の値 */
const values = ['FULL_TIME', 'PART_TIME', 'CONTRACT'] as const

const schema = z.enum(values)

type EmploymentType = z.infer<typeof schema>

/** 雇用形態の日本語ラベル */
const labelMap: Record<EmploymentType, string> = {
  FULL_TIME: '常勤',
  PART_TIME: '非常勤',
  CONTRACT: 'パート',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as EmploymentType,
  label,
}))

export const employmentType = { values, schema, labelMap, options }
export type { EmploymentType }
