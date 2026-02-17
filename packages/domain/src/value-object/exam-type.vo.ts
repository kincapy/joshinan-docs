import { z } from 'zod'

/** 試験種別の値 */
const values = ['JLPT', 'JFT_BASIC', 'NAT_TEST', 'J_TEST', 'SSW_SKILL', 'OTHER'] as const

const schema = z.enum(values)

type ExamType = z.infer<typeof schema>

/** 試験種別の日本語ラベル */
const labelMap: Record<ExamType, string> = {
  JLPT: '日本語能力試験',
  JFT_BASIC: '国際交流基金日本語基礎テスト',
  NAT_TEST: 'NAT-TEST',
  J_TEST: 'J-TEST',
  SSW_SKILL: '特定技能評価試験（技能）',
  OTHER: 'その他',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ExamType,
  label,
}))

export const examType = { values, schema, labelMap, options }
export type { ExamType }
