import { z } from 'zod'

/** メッセージ送信者の値 */
const values = ['USER', 'ASSISTANT', 'SYSTEM'] as const

const schema = z.enum(values)

type MessageRole = z.infer<typeof schema>

/** メッセージ送信者の日本語ラベル */
const labelMap: Record<MessageRole, string> = {
  USER: 'ユーザー',
  ASSISTANT: 'AI',
  SYSTEM: 'システム',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as MessageRole,
  label,
}))

export const messageRole = { values, schema, labelMap, options }
export type { MessageRole }
