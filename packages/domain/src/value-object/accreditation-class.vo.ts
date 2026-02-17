import { z } from 'zod'

/** 適正校分類の値 */
const values = ['CLASS_I', 'CLASS_II', 'NON_ACCREDITED'] as const

const schema = z.enum(values)

type AccreditationClass = z.infer<typeof schema>

/** 適正校分類の日本語ラベル */
const labelMap: Record<AccreditationClass, string> = {
  CLASS_I: 'クラスI（在籍管理優良校）',
  CLASS_II: 'クラスII（適正校）',
  NON_ACCREDITED: '非適正校',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AccreditationClass,
  label,
}))

export const accreditationClass = { values, schema, labelMap, options }
export type { AccreditationClass }
