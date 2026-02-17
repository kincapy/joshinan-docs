import { z } from 'zod'

/** 出力形式の値 */
const values = ['EXCEL', 'DOCX'] as const

const schema = z.enum(values)

type OutputFormat = z.infer<typeof schema>

/** 出力形式の日本語ラベル */
const labelMap: Record<OutputFormat, string> = {
  EXCEL: 'Excel',
  DOCX: 'Word',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as OutputFormat,
  label,
}))

export const outputFormat = { values, schema, labelMap, options }
export type { OutputFormat }
