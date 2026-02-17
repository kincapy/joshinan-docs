import { z } from 'zod'

/** 入学コホートの値 */
const values = ['APRIL', 'JULY', 'OCTOBER', 'JANUARY'] as const

const schema = z.enum(values)

type Cohort = z.infer<typeof schema>

/** 入学コホートの日本語ラベル */
const labelMap: Record<Cohort, string> = {
  APRIL: '4月期',
  JULY: '7月期',
  OCTOBER: '10月期',
  JANUARY: '1月期',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as Cohort,
  label,
}))

export const cohort = { values, schema, labelMap, options }
export type { Cohort }
