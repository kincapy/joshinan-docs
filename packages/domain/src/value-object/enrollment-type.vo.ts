import { z } from 'zod'

/** 在籍タイプの値 */
const values = ['REGULAR', 'SUB_CLASS'] as const

const schema = z.enum(values)

type EnrollmentType = z.infer<typeof schema>

/** 在籍タイプの日本語ラベル */
const labelMap: Record<EnrollmentType, string> = {
  REGULAR: '通常',
  SUB_CLASS: 'サブクラス',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as EnrollmentType,
  label,
}))

export const enrollmentType = { values, schema, labelMap, options }
export type { EnrollmentType }
