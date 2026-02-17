import { z } from 'zod'

/** 性別の値 */
const values = ['MALE', 'FEMALE'] as const

const schema = z.enum(values)

type Gender = z.infer<typeof schema>

/** 性別の日本語ラベル */
const labelMap: Record<Gender, string> = {
  MALE: '男性',
  FEMALE: '女性',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as Gender,
  label,
}))

export const gender = { values, schema, labelMap, options }
export type { Gender }
