import { z } from 'zod'

/** チェック種別の値 */
const values = ['COMPLETENESS', 'TRANSLATION', 'ORDER'] as const

const schema = z.enum(values)

type CheckType = z.infer<typeof schema>

/** チェック種別の日本語ラベル */
const labelMap: Record<CheckType, string> = {
  COMPLETENESS: '網羅性',
  TRANSLATION: '訳文有無',
  ORDER: '並び順',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CheckType,
  label,
}))

export const checkType = { values, schema, labelMap, options }
export type { CheckType }
