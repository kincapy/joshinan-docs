import { z } from 'zod'

/** 出席率アラートレベルの値 */
const values = ['NORMAL', 'GUIDANCE_REQUIRED', 'REPORT_REQUIRED'] as const

const schema = z.enum(values)

type AttendanceAlertLevel = z.infer<typeof schema>

/** 出席率アラートレベルの日本語ラベル */
const labelMap: Record<AttendanceAlertLevel, string> = {
  NORMAL: '正常',
  GUIDANCE_REQUIRED: '指導必要',
  REPORT_REQUIRED: '入管報告必要',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AttendanceAlertLevel,
  label,
}))

export const attendanceAlertLevel = { values, schema, labelMap, options }
export type { AttendanceAlertLevel }
