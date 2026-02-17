import { z } from 'zod'

/** 給与形態の値 */
const values = ['MONTHLY_SALARY', 'HOURLY_WAGE', 'PER_LESSON'] as const

const schema = z.enum(values)

type PayType = z.infer<typeof schema>

/** 給与形態の日本語ラベル */
const labelMap: Record<PayType, string> = {
  MONTHLY_SALARY: '月給',
  HOURLY_WAGE: '時給+授業手当',
  PER_LESSON: 'コマ給',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as PayType,
  label,
}))

export const payType = { values, schema, labelMap, options }
export type { PayType }
