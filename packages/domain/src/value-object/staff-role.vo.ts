import { z } from 'zod'

/** 役職の値 */
const values = [
  'PRINCIPAL',
  'HEAD_TEACHER',
  'FULL_TIME_TEACHER',
  'PART_TIME_TEACHER',
  'LIFE_COUNSELOR',
  'ADMINISTRATIVE_STAFF',
  'MANAGEMENT',
] as const

const schema = z.enum(values)

type StaffRole = z.infer<typeof schema>

/** 役職の日本語ラベル */
const labelMap: Record<StaffRole, string> = {
  PRINCIPAL: '校長',
  HEAD_TEACHER: '教務主任',
  FULL_TIME_TEACHER: '常勤講師',
  PART_TIME_TEACHER: '非常勤講師',
  LIFE_COUNSELOR: '生活指導員',
  ADMINISTRATIVE_STAFF: '事務担当',
  MANAGEMENT: '経営者',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as StaffRole,
  label,
}))

export const staffRole = { values, schema, labelMap, options }
export type { StaffRole }
