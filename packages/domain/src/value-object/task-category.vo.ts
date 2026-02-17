import { z } from 'zod'

/** タスクカテゴリの値 */
const values = [
  'DOCUMENT_CREATION',
  'DOCUMENT_COLLECTION',
  'DATA_ENTRY',
  'REVIEW',
  'OUTPUT',
] as const

const schema = z.enum(values)

type TaskCategory = z.infer<typeof schema>

/** タスクカテゴリの日本語ラベル */
const labelMap: Record<TaskCategory, string> = {
  DOCUMENT_CREATION: '書類作成',
  DOCUMENT_COLLECTION: '書類収集',
  DATA_ENTRY: 'データ入力',
  REVIEW: '確認・レビュー',
  OUTPUT: '成果物の出力',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as TaskCategory,
  label,
}))

export const taskCategory = { values, schema, labelMap, options }
export type { TaskCategory }
