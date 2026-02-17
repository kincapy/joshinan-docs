import { z } from 'zod'

/** 資格種別の値 */
const values = [
  'MAJOR',
  'MINOR',
  'TRAINING_420H',
  'CERTIFICATION_EXAM',
  'REGISTERED_TEACHER',
] as const

const schema = z.enum(values)

type QualificationType = z.infer<typeof schema>

/** 資格種別の日本語ラベル */
const labelMap: Record<QualificationType, string> = {
  MAJOR: '主専攻',
  MINOR: '副専攻',
  TRAINING_420H: '420時間養成講座',
  CERTIFICATION_EXAM: '検定合格',
  REGISTERED_TEACHER: '登録日本語教師',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as QualificationType,
  label,
}))

export const qualificationType = { values, schema, labelMap, options }
export type { QualificationType }
