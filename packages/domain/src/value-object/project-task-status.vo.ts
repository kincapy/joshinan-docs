import { z } from 'zod'

/** プロジェクトタスクステータスの値 */
const values = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_REQUIRED', 'RETURNED'] as const

const schema = z.enum(values)

type ProjectTaskStatus = z.infer<typeof schema>

/** プロジェクトタスクステータスの日本語ラベル */
const labelMap: Record<ProjectTaskStatus, string> = {
  NOT_STARTED: '未着手',
  IN_PROGRESS: '対応中',
  COMPLETED: '完了',
  NOT_REQUIRED: '不要',
  RETURNED: '差戻し',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ProjectTaskStatus,
  label,
}))

export const projectTaskStatus = { values, schema, labelMap, options }
export type { ProjectTaskStatus }
