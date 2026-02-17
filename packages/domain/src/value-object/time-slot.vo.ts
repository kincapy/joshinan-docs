import { z } from 'zod'

/** 時間帯区分の値 */
const values = ['MORNING', 'AFTERNOON'] as const

const schema = z.enum(values)

type TimeSlot = z.infer<typeof schema>

/** 時間帯区分の日本語ラベル */
const labelMap: Record<TimeSlot, string> = {
  MORNING: '午前',
  AFTERNOON: '午後',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as TimeSlot,
  label,
}))

export const timeSlot = { values, schema, labelMap, options }
export type { TimeSlot }
