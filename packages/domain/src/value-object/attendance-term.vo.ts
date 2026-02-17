import { z } from 'zod'

/** 出席率報告期間の値 */
const values = ['FIRST_HALF', 'SECOND_HALF'] as const

const schema = z.enum(values)

type AttendanceTerm = z.infer<typeof schema>

/** 出席率報告期間の日本語ラベル */
const labelMap: Record<AttendanceTerm, string> = {
  FIRST_HALF: '前期',
  SECOND_HALF: '後期',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AttendanceTerm,
  label,
}))

export const attendanceTerm = { values, schema, labelMap, options }
export type { AttendanceTerm }
