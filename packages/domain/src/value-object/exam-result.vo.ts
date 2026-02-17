import { z } from 'zod'

/** 試験結果の値 */
const values = ['PASSED', 'FAILED', 'PENDING'] as const

const schema = z.enum(values)

type ExamResult = z.infer<typeof schema>

/** 試験結果の日本語ラベル */
const labelMap: Record<ExamResult, string> = {
  PASSED: '合格',
  FAILED: '不合格',
  PENDING: '結果待ち',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ExamResult,
  label,
}))

export const examResult = { values, schema, labelMap, options }
export type { ExamResult }
