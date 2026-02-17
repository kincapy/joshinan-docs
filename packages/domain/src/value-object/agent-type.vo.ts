import { z } from 'zod'

/** エージェント種別の値 */
const values = ['SCHOOL_OPERATOR', 'BROKER', 'INDIVIDUAL'] as const

const schema = z.enum(values)

type AgentType = z.infer<typeof schema>

/** エージェント種別の日本語ラベル */
const labelMap: Record<AgentType, string> = {
  SCHOOL_OPERATOR: '自社学校運営',
  BROKER: '紹介のみ',
  INDIVIDUAL: '個人エージェント',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as AgentType,
  label,
}))

export const agentType = { values, schema, labelMap, options }
export type { AgentType }
