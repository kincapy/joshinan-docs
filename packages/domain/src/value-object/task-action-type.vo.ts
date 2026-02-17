import { z } from 'zod'

/** タスクのアクション種別の値 */
const values = ['FILE_UPLOAD', 'FORM_INPUT', 'AUTO_GENERATE', 'MANUAL_CHECK'] as const

const schema = z.enum(values)

type TaskActionType = z.infer<typeof schema>

/** タスクのアクション種別の日本語ラベル */
const labelMap: Record<TaskActionType, string> = {
  FILE_UPLOAD: 'ファイルアップロード',
  FORM_INPUT: 'フォーム入力',
  AUTO_GENERATE: '自動生成',
  MANUAL_CHECK: '手動確認',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as TaskActionType,
  label,
}))

export const taskActionType = { values, schema, labelMap, options }
export type { TaskActionType }
