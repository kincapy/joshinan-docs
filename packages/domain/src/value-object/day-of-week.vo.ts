import { z } from 'zod'

/** 曜日の値 */
const values = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const schema = z.enum(values)

type DayOfWeek = z.infer<typeof schema>

/** 曜日の日本語ラベル */
const labelMap: Record<DayOfWeek, string> = {
  SUN: '日',
  MON: '月',
  TUE: '火',
  WED: '水',
  THU: '木',
  FRI: '金',
  SAT: '土',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as DayOfWeek,
  label,
}))

export const dayOfWeek = { values, schema, labelMap, options }
export type { DayOfWeek }
