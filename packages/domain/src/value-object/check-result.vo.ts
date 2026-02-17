import { z } from 'zod'

/** チェック結果の値 */
const values = ['OK', 'NG'] as const

const schema = z.enum(values)

type CheckResult = z.infer<typeof schema>

/** チェック結果の日本語ラベル */
const labelMap: Record<CheckResult, string> = {
  OK: 'OK',
  NG: 'NG',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CheckResult,
  label,
}))

export const checkResult = { values, schema, labelMap, options }
export type { CheckResult }
