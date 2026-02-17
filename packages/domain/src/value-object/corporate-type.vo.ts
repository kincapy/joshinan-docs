import { z } from 'zod'

/** 法人種別の値 */
const values = ['SCHOOL_CORPORATION', 'STOCK_COMPANY', 'OTHER'] as const

const schema = z.enum(values)

type CorporateType = z.infer<typeof schema>

/** 法人種別の日本語ラベル */
const labelMap: Record<CorporateType, string> = {
  SCHOOL_CORPORATION: '学校法人',
  STOCK_COMPANY: '株式会社',
  OTHER: 'その他',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as CorporateType,
  label,
}))

export const corporateType = { values, schema, labelMap, options }
export type { CorporateType }
