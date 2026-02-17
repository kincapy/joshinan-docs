import { z } from 'zod'

/** プロジェクトステータスの値 */
const values = ['ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED'] as const

const schema = z.enum(values)

type ProjectStatus = z.infer<typeof schema>

/** プロジェクトステータスの日本語ラベル */
const labelMap: Record<ProjectStatus, string> = {
  ACTIVE: '進行中',
  COMPLETED: '完了',
  SUSPENDED: '中断',
  CANCELLED: '取消',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ProjectStatus,
  label,
}))

export const projectStatus = { values, schema, labelMap, options }
export type { ProjectStatus }
