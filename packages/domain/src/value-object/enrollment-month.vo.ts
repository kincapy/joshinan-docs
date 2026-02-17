import { z } from 'zod'

/** 入学月の値 */
const values = ['APRIL', 'OCTOBER', 'JANUARY', 'JULY'] as const

const schema = z.enum(values)

type EnrollmentMonth = z.infer<typeof schema>

/** 入学月の日本語ラベル */
const labelMap: Record<EnrollmentMonth, string> = {
  APRIL: '4月',
  OCTOBER: '10月',
  JANUARY: '1月',
  JULY: '7月',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as EnrollmentMonth,
  label,
}))

export const enrollmentMonth = { values, schema, labelMap, options }
export type { EnrollmentMonth }
