import { z } from 'zod'

/** 入寮ステータスの値 */
const values = ['ACTIVE', 'ENDED'] as const

const schema = z.enum(values)

type AssignmentStatus = z.infer<typeof schema>

/** 入寮ステータスの日本語ラベル */
const labelMap: Record<AssignmentStatus, string> = {
  ACTIVE: '入居中',
  ENDED: '退寮済み',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AssignmentStatus,
  label,
}))

export const assignmentStatus = { values, schema, labelMap, options }
export type { AssignmentStatus }
