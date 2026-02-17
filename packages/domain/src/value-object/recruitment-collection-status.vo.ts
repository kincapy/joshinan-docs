import { z } from 'zod'

/** 募集書類収集状態の値 */
const values = ['NOT_RECEIVED', 'RECEIVED', 'VERIFIED', 'DEFICIENT'] as const

const schema = z.enum(values)

type RecruitmentCollectionStatus = z.infer<typeof schema>

/** 募集書類収集状態の日本語ラベル */
const labelMap: Record<RecruitmentCollectionStatus, string> = {
  NOT_RECEIVED: '未受領',
  RECEIVED: '受領済',
  VERIFIED: '確認済',
  DEFICIENT: '不備あり',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as RecruitmentCollectionStatus,
  label,
}))

export const recruitmentCollectionStatus = { values, schema, labelMap, options }
export type { RecruitmentCollectionStatus }
