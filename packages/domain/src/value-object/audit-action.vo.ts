import { z } from 'zod'

/** 監査アクションの値 */
const values = ['CREATE', 'UPDATE', 'DELETE', 'KNOWLEDGE_UPDATE'] as const

const schema = z.enum(values)

type AuditAction = z.infer<typeof schema>

/** 監査アクションの日本語ラベル */
const labelMap: Record<AuditAction, string> = {
  CREATE: '新規作成',
  UPDATE: '更新',
  DELETE: '削除',
  KNOWLEDGE_UPDATE: 'ナレッジ更新',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AuditAction,
  label,
}))

export const auditAction = { values, schema, labelMap, options }
export type { AuditAction }
