import { z } from 'zod'

/** プロジェクト内の権限の値 */
const values = ['OWNER', 'EDITOR', 'VIEWER'] as const

const schema = z.enum(values)

type ProjectRole = z.infer<typeof schema>

/** プロジェクト内の権限の日本語ラベル */
const labelMap: Record<ProjectRole, string> = {
  OWNER: 'オーナー',
  EDITOR: '編集者',
  VIEWER: '閲覧者',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ProjectRole,
  label,
}))

export const projectRole = { values, schema, labelMap, options }
export type { ProjectRole }
