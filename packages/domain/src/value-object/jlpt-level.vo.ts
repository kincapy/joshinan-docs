import { z } from 'zod'

/** JLPTレベルの値 */
const values = ['N1', 'N2', 'N3', 'N4', 'N5'] as const

const schema = z.enum(values)

type JlptLevel = z.infer<typeof schema>

/** JLPTレベルの日本語ラベル */
const labelMap: Record<JlptLevel, string> = {
  N1: 'N1',
  N2: 'N2',
  N3: 'N3',
  N4: 'N4',
  N5: 'N5',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as JlptLevel,
  label,
}))

export const jlptLevel = { values, schema, labelMap, options }
export type { JlptLevel }
