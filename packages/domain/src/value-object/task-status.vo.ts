import { z } from 'zod'

/** タスクステータスの値 */
const values = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const

const schema = z.enum(values)

type TaskStatus = z.infer<typeof schema>

/** タスクステータスの日本語ラベル */
const labelMap: Record<TaskStatus, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  DONE: '完了',
  OVERDUE: '期限超過',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as TaskStatus,
  label,
}))

export const taskStatus = { values, schema, labelMap, options }
export type { TaskStatus }
