import { z } from 'zod'

/** 入学月の値 */
const values = ['APRIL', 'OCTOBER', 'JANUARY', 'JULY'] as const

const schema = z.enum(values)

type EnrollmentMonth = z.infer<typeof schema>

/** 入学月の日本語ラベル */
const labelMap: Record<EnrollmentMonth, string> = {
  APRIL: '4月',
  OCTOBER: '10月',
  JANUARY: '1月',
  JULY: '7月',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as EnrollmentMonth,
  label,
}))

/**
 * 入学月ごとの在籍期間（月数）マッピング
 * 入管制度で定められた標準的な在籍期間
 */
const durationMap: Record<EnrollmentMonth, number> = {
  APRIL: 24,
  OCTOBER: 18,
  JANUARY: 15,
  JULY: 21,
} as const

/** 入学月から在籍期間（月数）を取得する */
function getDurationMonths(month: EnrollmentMonth): number {
  return durationMap[month]
}

export const enrollmentMonth = { values, schema, labelMap, options, durationMap, getDurationMonths }
export type { EnrollmentMonth }
