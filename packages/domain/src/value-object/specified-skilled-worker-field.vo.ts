import { z } from 'zod'

/** 特定技能分野の値 */
const values = [
  'NURSING_CARE',
  'BUILDING_CLEANING',
  'MANUFACTURING',
  'CONSTRUCTION',
  'SHIPBUILDING',
  'AUTO_MAINTENANCE',
  'AVIATION',
  'ACCOMMODATION',
  'AGRICULTURE',
  'FISHERY',
  'FOOD_MANUFACTURING',
  'FOOD_SERVICE',
] as const

const schema = z.enum(values)

type SpecifiedSkilledWorkerField = z.infer<typeof schema>

/** 特定技能分野の日本語ラベル */
const labelMap: Record<SpecifiedSkilledWorkerField, string> = {
  NURSING_CARE: '介護',
  BUILDING_CLEANING: 'ビルクリーニング',
  MANUFACTURING: '素形材・産業機械・電気電子情報関連製造業',
  CONSTRUCTION: '建設',
  SHIPBUILDING: '造船・舶用工業',
  AUTO_MAINTENANCE: '自動車整備',
  AVIATION: '航空',
  ACCOMMODATION: '宿泊',
  AGRICULTURE: '農業',
  FISHERY: '漁業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  FOOD_SERVICE: '外食業',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as SpecifiedSkilledWorkerField,
  label,
}))

export const specifiedSkilledWorkerField = { values, schema, labelMap, options }
export type { SpecifiedSkilledWorkerField }
