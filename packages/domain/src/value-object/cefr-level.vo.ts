import { z } from 'zod'

/** CEFRレベルの値 */
const values = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

const schema = z.enum(values)

type CefrLevel = z.infer<typeof schema>

/** CEFRレベルの日本語ラベル */
const labelMap: Record<CefrLevel, string> = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CefrLevel,
  label,
}))

export const cefrLevel = { values, schema, labelMap, options }
export type { CefrLevel }
