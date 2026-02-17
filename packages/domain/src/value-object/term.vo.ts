import { z } from 'zod'

/** 学期の値 */
const values = ['FIRST_HALF', 'SECOND_HALF'] as const

const schema = z.enum(values)

type Term = z.infer<typeof schema>

/** 学期の日本語ラベル */
const labelMap: Record<Term, string> = {
  FIRST_HALF: '前期',
  SECOND_HALF: '後期',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as Term,
  label,
}))

export const term = { values, schema, labelMap, options }
export type { Term }
