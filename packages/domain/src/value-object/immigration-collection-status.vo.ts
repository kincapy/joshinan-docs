import { z } from 'zod'

/** 入管書類収集状態の値 */
const values = ['NOT_COLLECTED', 'COLLECTED', 'AUTO_GENERATED'] as const

const schema = z.enum(values)

type ImmigrationCollectionStatus = z.infer<typeof schema>

/** 入管書類収集状態の日本語ラベル */
const labelMap: Record<ImmigrationCollectionStatus, string> = {
  NOT_COLLECTED: '未回収',
  COLLECTED: '回収済み',
  AUTO_GENERATED: 'システム自動生成',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ImmigrationCollectionStatus,
  label,
}))

export const immigrationCollectionStatus = { values, schema, labelMap, options }
export type { ImmigrationCollectionStatus }
