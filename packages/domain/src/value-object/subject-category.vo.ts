import { z } from 'zod'

/** 科目カテゴリの値 */
const values = [
  'GRAMMAR',
  'READING',
  'LISTENING',
  'CONVERSATION',
  'KANJI',
  'COMPOSITION',
  'OTHER',
] as const

const schema = z.enum(values)

type SubjectCategory = z.infer<typeof schema>

/** 科目カテゴリの日本語ラベル */
const labelMap: Record<SubjectCategory, string> = {
  GRAMMAR: '文法',
  READING: '読解',
  LISTENING: '聴解',
  CONVERSATION: '会話',
  KANJI: '漢字',
  COMPOSITION: '作文',
  OTHER: 'その他',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as SubjectCategory,
  label,
}))

export const subjectCategory = { values, schema, labelMap, options }
export type { SubjectCategory }
