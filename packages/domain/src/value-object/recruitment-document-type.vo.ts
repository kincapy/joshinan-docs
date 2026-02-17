import { z } from 'zod'

/** 申請書類種別の値 */
const values = [
  'APPLICATION_FORM',
  'CHECKLIST',
  'PASSPORT_COPY',
  'JAPANESE_ABILITY',
  'FINANCIAL_SUPPORT',
  'RELATIONSHIP_PROOF',
  'BANK_BALANCE',
  'FUND_FORMATION',
  'SCHOLARSHIP',
  'MINOR_SUPPORT',
  'REASON_STATEMENT',
  'OTHER',
] as const

const schema = z.enum(values)

type RecruitmentDocumentType = z.infer<typeof schema>

/** 申請書類種別の日本語ラベル */
const labelMap: Record<RecruitmentDocumentType, string> = {
  APPLICATION_FORM: '在留資格認定証明書交付申請書',
  CHECKLIST: '提出書類一覧表・各種確認書',
  PASSPORT_COPY: '旅券写し',
  JAPANESE_ABILITY: '日本語能力資料',
  FINANCIAL_SUPPORT: '経費支弁書',
  RELATIONSHIP_PROOF: '経費支弁者との関係立証資料',
  BANK_BALANCE: '預金残高証明書',
  FUND_FORMATION: '資金形成経緯資料',
  SCHOLARSHIP: '奨学金証明',
  MINOR_SUPPORT: '未成年者の経費支弁に関する補足',
  REASON_STATEMENT: '理由書',
  OTHER: 'その他',
} as const

/** セレクトボックス用選択肢 */
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as RecruitmentDocumentType,
  label,
}))

export const recruitmentDocumentType = { values, schema, labelMap, options }
export type { RecruitmentDocumentType }
