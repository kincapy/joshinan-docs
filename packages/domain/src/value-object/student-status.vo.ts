import { z } from 'zod'

/** 学生ステータスの値 */
const values = [
  'PRE_ENROLLMENT',
  'ENROLLED',
  'ON_LEAVE',
  'WITHDRAWN',
  'EXPELLED',
  'GRADUATED',
  'COMPLETED',
] as const

const schema = z.enum(values)

type StudentStatus = z.infer<typeof schema>

/** 学生ステータスの日本語ラベル */
const labelMap: Record<StudentStatus, string> = {
  PRE_ENROLLMENT: '入学前',
  ENROLLED: '在学',
  ON_LEAVE: '休学',
  WITHDRAWN: '退学',
  EXPELLED: '除籍',
  GRADUATED: '卒業',
  COMPLETED: '修了',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as StudentStatus,
  label,
}))

export const studentStatus = { values, schema, labelMap, options }
export type { StudentStatus }
