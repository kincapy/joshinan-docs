import { z } from 'zod'

/** 出欠ステータスの値 */
const values = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EARLY_LEAVE',
  'EXCUSED',
  'SUSPENDED',
] as const

const schema = z.enum(values)

type AttendanceStatus = z.infer<typeof schema>

/** 出欠ステータスの日本語ラベル */
const labelMap: Record<AttendanceStatus, string> = {
  PRESENT: '出席',
  ABSENT: '欠席',
  LATE: '遅刻',
  EARLY_LEAVE: '早退',
  EXCUSED: '公欠',
  SUSPENDED: '出停',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AttendanceStatus,
  label,
}))

export const attendanceStatus = { values, schema, labelMap, options }
export type { AttendanceStatus }
