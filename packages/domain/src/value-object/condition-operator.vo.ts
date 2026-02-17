import { z } from 'zod'

/** 条件分岐演算子の値 */
const values = ['EQUALS', 'NOT_EQUALS', 'IN', 'IS_TRUE', 'IS_FALSE'] as const

const schema = z.enum(values)

type ConditionOperator = z.infer<typeof schema>

/** 条件分岐演算子の日本語ラベル */
const labelMap: Record<ConditionOperator, string> = {
  EQUALS: '一致',
  NOT_EQUALS: '不一致',
  IN: 'いずれかに一致',
  IS_TRUE: 'true',
  IS_FALSE: 'false',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ConditionOperator,
  label,
}))

export const conditionOperator = { values, schema, labelMap, options }
export type { ConditionOperator }
