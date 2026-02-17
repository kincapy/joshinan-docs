import { z } from 'zod'

/** タスク発生トリガーの値 */
const values = ['EVENT', 'SCHEDULE'] as const

const schema = z.enum(values)

type TaskTrigger = z.infer<typeof schema>

/** タスク発生トリガーの日本語ラベル */
const labelMap: Record<TaskTrigger, string> = {
  EVENT: 'イベントベース',
  SCHEDULE: 'スケジュールベース',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as TaskTrigger,
  label,
}))

export const taskTrigger = { values, schema, labelMap, options }
export type { TaskTrigger }
