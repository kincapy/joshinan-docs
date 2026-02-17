import { z } from 'zod'

/** 定期報告種別の値 */
const values = [
  'ENROLLMENT_COUNT_MAY',
  'ENROLLMENT_COUNT_NOV',
  'ATTENDANCE_FIRST_HALF',
  'ATTENDANCE_SECOND_HALF',
  'PERIODIC_INSPECTION',
  'COURSE_COMPLETION',
  'OPERATION_STATUS',
  'BUSINESS_PLAN',
] as const

const schema = z.enum(values)

type ScheduledReportType = z.infer<typeof schema>

/** 定期報告種別の日本語ラベル */
const labelMap: Record<ScheduledReportType, string> = {
  ENROLLMENT_COUNT_MAY: '在籍者数届出（5月）',
  ENROLLMENT_COUNT_NOV: '在籍者数届出（11月）',
  ATTENDANCE_FIRST_HALF: '出席率報告（前期）',
  ATTENDANCE_SECOND_HALF: '出席率報告（後期）',
  PERIODIC_INSPECTION: '定期点検報告書',
  COURSE_COMPLETION: '課程修了者報告',
  OPERATION_STATUS: '運営状況報告（文科省）',
  BUSINESS_PLAN: '事業計画書',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ScheduledReportType,
  label,
}))

export const scheduledReportType = { values, schema, labelMap, options }
export type { ScheduledReportType }
