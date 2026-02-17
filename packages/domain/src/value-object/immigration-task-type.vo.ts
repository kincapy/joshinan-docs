import { z } from 'zod'

/** 入管タスク種別の値 */
const values = [
  'WITHDRAWAL_REPORT',
  'LOW_ATTENDANCE_REPORT',
  'ENROLLMENT_NOTIFICATION',
  'DEPARTURE_NOTIFICATION',
  'MISSING_PERSON_REPORT',
  'CHANGE_NOTIFICATION',
  'COE_APPLICATION',
  'VISA_RENEWAL',
] as const

const schema = z.enum(values)

type ImmigrationTaskType = z.infer<typeof schema>

/** 入管タスク種別の日本語ラベル */
const labelMap: Record<ImmigrationTaskType, string> = {
  WITHDRAWAL_REPORT: '退学者報告',
  LOW_ATTENDANCE_REPORT: '出席率5割未満報告',
  ENROLLMENT_NOTIFICATION: '受入れ開始届出',
  DEPARTURE_NOTIFICATION: '受入れ終了届出',
  MISSING_PERSON_REPORT: '所在不明者報告',
  CHANGE_NOTIFICATION: '変更届出',
  COE_APPLICATION: 'COE交付申請',
  VISA_RENEWAL: '在留期間更新',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ImmigrationTaskType,
  label,
}))

export const immigrationTaskType = { values, schema, labelMap, options }
export type { ImmigrationTaskType }
