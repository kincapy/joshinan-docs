import { z } from 'zod'

/** ユーザーロールの値（チャットボット・プロジェクト共通） */
const values = ['GENERAL', 'ADMIN', 'APPROVER'] as const

const schema = z.enum(values)

type UserRole = z.infer<typeof schema>

/** ユーザーロールの日本語ラベル */
const labelMap: Record<UserRole, string> = {
  GENERAL: '一般ユーザー',
  ADMIN: '管理者',
  APPROVER: '決裁者',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as UserRole,
  label,
}))

export const userRole = { values, schema, labelMap, options }
export type { UserRole }
