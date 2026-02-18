import type { DocumentDefinition, ExcelCellMapping, DocumentContext } from '../types'
import {
  toJapaneseNationality,
  toWareki,
  getDateParts,
  SSW_FIELD_LABELS,
  GENDER_LABELS,
} from '../constants'

/**
 * DOC-001: 在留資格変更許可申請書（別記第30号様式）
 *
 * 10シート構成。データを書き込む対象は以下の4シート:
 * - シート1「申請人用（変更）」: 申請人の基本情報（国籍・氏名・住所・旅券等）
 * - シート3「申請人用（変更）２V」: 特定技能固有（所属機関・技能水準・日本語能力）
 * - シート4「申請人用（変更）３V」: 保証金・職歴等（多くはチェックボックス）
 * - シート5「所属機関用（変更）V1」: 雇用契約情報
 * - シート6「所属機関用（変更）V2」: 企業情報・適合状況
 *
 * セルアドレスの特定方法:
 * テンプレート調査スクリプト（scripts/inspect-excel-template.ts）の出力から、
 * ラベルセルの隣に位置する空セルを入力対象として特定した。
 *
 * なぜ全シートを網羅しないか:
 * Phase 1 ではDBから自動入力可能なフィールドのみ対応する。
 * チェックボックス系の設問（有・無の選択）や手動入力項目は Phase 2 で対応する。
 */

// ============================================================
// シート1: 申請人用（変更）— 申請人の基本情報
// ============================================================

const SHEET1_NAME = '申請人用（変更）'

/** シート1のマッピング: 学生の基本情報 */
const sheet1Mappings: ExcelCellMapping[] = [
  // 1. 国籍・地域
  {
    sheetName: SHEET1_NAME,
    cell: 'B15',
    getValue: (ctx) => toJapaneseNationality(ctx.student.nationality),
  },

  // 2. 生年月日（年・月・日が別セル）
  {
    sheetName: SHEET1_NAME,
    cell: 'Y15',
    getValue: (ctx) => getDateParts(ctx.student.dateOfBirth).warekiYear,
  },
  {
    sheetName: SHEET1_NAME,
    cell: 'AC15',
    getValue: (ctx) => getDateParts(ctx.student.dateOfBirth).month,
  },
  {
    sheetName: SHEET1_NAME,
    cell: 'AG15',
    getValue: (ctx) => getDateParts(ctx.student.dateOfBirth).day,
  },

  // 3. 氏名
  // Family name（姓）
  {
    sheetName: SHEET1_NAME,
    cell: 'B20',
    getValue: (ctx) => {
      // 英語名からFamily name を抽出（最後の単語）
      const parts = ctx.student.nameEn.trim().split(/\s+/)
      return parts.length > 1 ? parts[parts.length - 1] : ctx.student.nameEn
    },
  },
  // Given name（名）
  {
    sheetName: SHEET1_NAME,
    cell: 'N20',
    getValue: (ctx) => {
      // 英語名からGiven name を抽出（最後の単語以外）
      const parts = ctx.student.nameEn.trim().split(/\s+/)
      return parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
    },
  },

  // 4. 性別（男・女のどちらかに○をつける → テキストで書込み）
  {
    sheetName: SHEET1_NAME,
    cell: 'C21',
    getValue: (ctx) => GENDER_LABELS[ctx.student.gender] ?? '',
  },

  // 5. 出生地
  {
    sheetName: SHEET1_NAME,
    cell: 'K21',
    getValue: (ctx) => toJapaneseNationality(ctx.student.nationality),
  },

  // 7. 職業（特定技能申請の場合は「留学」や「会社員」等）
  {
    sheetName: SHEET1_NAME,
    cell: 'B24',
    getValue: () => '留学',
  },

  // 8. 本国における居住地
  {
    sheetName: SHEET1_NAME,
    cell: 'N24',
    getValue: (ctx) => ctx.student.addressJapan,
  },

  // 9. 住居地
  {
    sheetName: SHEET1_NAME,
    cell: 'B27',
    getValue: (ctx) => ctx.student.addressJapan,
  },
  // 電話番号
  {
    sheetName: SHEET1_NAME,
    cell: 'H30',
    getValue: (ctx) => ctx.student.phone,
  },
  // 携帯電話番号
  {
    sheetName: SHEET1_NAME,
    cell: 'Z30',
    getValue: (ctx) => ctx.student.phone,
  },

  // 10. 旅券 (1) 番号
  {
    sheetName: SHEET1_NAME,
    cell: 'H33',
    getValue: (ctx) => ctx.student.passportNumber,
  },
  // 旅券 (2) 有効期限（年・月・日）
  // ※旅券の有効期限はStudentテーブルに保持していないため、空のまま
  // （将来的に passportExpiry フィールドを追加して対応する可能性あり）

  // 11. 現に有する在留資格
  {
    sheetName: SHEET1_NAME,
    cell: 'B36',
    getValue: (ctx) => ctx.student.residenceStatus ?? '留学',
  },
  // 在留期間
  {
    sheetName: SHEET1_NAME,
    cell: 'W36',
    getValue: () => '',
  },
  // 在留期間の満了日（年・月・日）
  {
    sheetName: SHEET1_NAME,
    cell: 'I39',
    getValue: (ctx) => getDateParts(ctx.student.residenceExpiry).warekiYear,
  },
  {
    sheetName: SHEET1_NAME,
    cell: 'O39',
    getValue: (ctx) => getDateParts(ctx.student.residenceExpiry).month,
  },
  {
    sheetName: SHEET1_NAME,
    cell: 'S39',
    getValue: (ctx) => getDateParts(ctx.student.residenceExpiry).day,
  },

  // 12. 在留カード番号
  {
    sheetName: SHEET1_NAME,
    cell: 'B42',
    getValue: (ctx) => ctx.student.residenceCardNumber,
  },

  // 13. 希望する在留資格
  {
    sheetName: SHEET1_NAME,
    cell: 'B45',
    getValue: () => '特定技能1号',
  },

  // 14. 変更の理由
  {
    sheetName: SHEET1_NAME,
    cell: 'B51',
    getValue: (ctx) => {
      const field = SSW_FIELD_LABELS[ctx.project.sswField] ?? ''
      return `${field}分野の特定技能外国人として就労するため`
    },
  },
]

// ============================================================
// シート3: 申請人用（変更）２V — 特定技能固有情報
// ============================================================

const SHEET3_NAME = '申請人用（変更）２V '

/** シート3のマッピング: 特定技能所属機関・技能水準・日本語能力 */
const sheet3Mappings: ExcelCellMapping[] = [
  // 17. 特定技能所属機関 (1) 氏名又は名称
  {
    sheetName: SHEET3_NAME,
    cell: 'E6',
    getValue: (ctx) => ctx.company.name,
  },
  // (2) 住所（所在地）
  {
    sheetName: SHEET3_NAME,
    cell: 'B9',
    getValue: (ctx) => ctx.company.address,
  },
  // 電話番号
  {
    sheetName: SHEET3_NAME,
    cell: 'V9',
    getValue: (ctx) => ctx.company.phone,
  },
]

// ============================================================
// シート5: 所属機関用（変更）V1 — 雇用契約情報
// ============================================================

const SHEET5_NAME = '所属機関用（変更）V1 '

/** シート5のマッピング: 雇用契約 */
const sheet5Mappings: ExcelCellMapping[] = [
  // 1. 雇用している外国人の氏名
  {
    sheetName: SHEET5_NAME,
    cell: 'B4',
    getValue: (ctx) => {
      // 漢字名があれば漢字名、なければ英語名
      return ctx.student.nameKanji ?? ctx.student.nameEn
    },
  },

  // 2. 特定技能雇用契約
  // (2) 従事すべき業務の内容 - 特定産業分野
  {
    sheetName: SHEET5_NAME,
    cell: 'C15',
    getValue: (ctx) => SSW_FIELD_LABELS[ctx.project.sswField] ?? '',
  },

  // (13) 職業紹介事業者 - 氏名又は名称（常南交通）
  {
    sheetName: SHEET5_NAME,
    cell: 'C95',
    getValue: (ctx) => ctx.supportOrg.name,
  },
  // 法人番号
  {
    sheetName: SHEET5_NAME,
    cell: 'V95',
    getValue: (ctx) => ctx.supportOrg.corporateNumber,
  },
  // 住所
  {
    sheetName: SHEET5_NAME,
    cell: 'C103',
    getValue: (ctx) => ctx.supportOrg.address,
  },
  // 電話番号
  {
    sheetName: SHEET5_NAME,
    cell: 'Z103',
    getValue: (ctx) => ctx.supportOrg.phone,
  },
]

// ============================================================
// シート6: 所属機関用（変更）V2 — 企業情報
// ============================================================

const SHEET6_NAME = '所属機関用（変更）V2 '

/** シート6のマッピング: 企業情報 */
const sheet6Mappings: ExcelCellMapping[] = [
  // 3. 特定技能所属機関
  // (1) 氏名又は名称
  {
    sheetName: SHEET6_NAME,
    cell: 'C15',
    getValue: (ctx) => ctx.company.name,
  },
  // (2) 法人番号
  {
    sheetName: SHEET6_NAME,
    cell: 'U15',
    getValue: (ctx) => ctx.company.corporateNumber,
  },
  // (5) 住所（所在地）
  {
    sheetName: SHEET6_NAME,
    cell: 'B29',
    getValue: (ctx) => ctx.company.address,
  },
  // 電話番号
  {
    sheetName: SHEET6_NAME,
    cell: 'Z31',
    getValue: (ctx) => ctx.company.phone,
  },
  // (9) 代表者の氏名
  {
    sheetName: SHEET6_NAME,
    cell: 'S37',
    getValue: (ctx) => ctx.company.representative,
  },
]

// ============================================================
// シート4: 申請人用（変更）３V — 署名日
// ============================================================

const SHEET4_NAME = '申請人用（変更）３V '

/**
 * シート4のマッピング: 申請書作成年月日
 *
 * 設問22〜27（有・無チェック）と職歴は Phase 2 で対応。
 * ここでは申請書作成日のみ自動入力する。
 */
const sheet4Mappings: ExcelCellMapping[] = [
  // 申請書作成年月日（年・月・日が別セル）
  {
    sheetName: SHEET4_NAME,
    cell: 'W59',
    getValue: () => getDateParts(new Date()).warekiYear,
  },
  {
    sheetName: SHEET4_NAME,
    cell: 'AA59',
    getValue: () => getDateParts(new Date()).month,
  },
  {
    sheetName: SHEET4_NAME,
    cell: 'AF59',
    getValue: () => getDateParts(new Date()).day,
  },
]

// ============================================================
// シート8: 所属機関用（変更）V4 — 登録支援機関情報
// ============================================================

const SHEET8_NAME = '所属機関用（変更）V4 '

/**
 * シート8のマッピング: 登録支援機関（常南交通）の情報
 *
 * 設問39〜42、支援計画(1)〜(16) の有・無チェックは Phase 2 で対応。
 * ここでは登録支援機関の固定情報のみ自動入力する。
 */
const sheet8Mappings: ExcelCellMapping[] = [
  // (1) 氏名又は名称
  {
    sheetName: SHEET8_NAME,
    cell: 'C85',
    getValue: (ctx) => ctx.supportOrg.name,
  },
  // (2) 法人番号
  {
    sheetName: SHEET8_NAME,
    cell: 'U85',
    getValue: (ctx) => ctx.supportOrg.corporateNumber,
  },
  // (4) 住所（所在地）
  {
    sheetName: SHEET8_NAME,
    cell: 'C90',
    getValue: (ctx) => ctx.supportOrg.address,
  },
  // 電話番号
  {
    sheetName: SHEET8_NAME,
    cell: 'AA90',
    getValue: (ctx) => ctx.supportOrg.phone,
  },
  // (5) 代表者の氏名
  {
    sheetName: SHEET8_NAME,
    cell: 'C92',
    getValue: (ctx) => ctx.supportOrg.representative,
  },
  // (6) 登録番号
  {
    sheetName: SHEET8_NAME,
    cell: 'F93',
    getValue: (ctx) => ctx.supportOrg.registrationNumber,
  },
  // (8) 支援を行う事業所の名称（本社と同一）
  {
    sheetName: SHEET8_NAME,
    cell: 'C96',
    getValue: (ctx) => ctx.supportOrg.name,
  },
  // (9) 所在地（本社と同一）
  {
    sheetName: SHEET8_NAME,
    cell: 'X96',
    getValue: (ctx) => ctx.supportOrg.address,
  },
  // (10) 支援責任者名
  {
    sheetName: SHEET8_NAME,
    cell: 'C98',
    getValue: (ctx) => ctx.supportOrg.supportManager,
  },
  // (11) 支援担当者名（支援責任者と同一人物）
  {
    sheetName: SHEET8_NAME,
    cell: 'U98',
    getValue: (ctx) => ctx.supportOrg.supportManager,
  },
]

// ============================================================
// DOC-001 書類定義
// ============================================================

/** DOC-001 の全マッピングを統合 */
const allMappings: ExcelCellMapping[] = [
  ...sheet1Mappings,
  ...sheet3Mappings,
  ...sheet4Mappings,
  ...sheet5Mappings,
  ...sheet6Mappings,
  ...sheet8Mappings,
]

/**
 * DOC-001: 在留資格変更許可申請書
 *
 * 出入国在留管理庁の公式様式（別記第30号）に、
 * Student + Company + 登録支援機関の情報を自動入力する。
 *
 * Phase 1: DBから自動入力可能なフィールドのみ。
 * チェックボックス系（有・無の選択）は Phase 2 で対応。
 */
export const DOC_001: DocumentDefinition = {
  docCode: 'DOC-001',
  docName: '在留資格変更許可申請書（申請人等作成用）',
  templateFileName: 'DOC-001_別記第30号_在留資格変更許可申請書.xlsx',
  getOutputFileName: (ctx) => {
    const studentName = ctx.student.nameKanji ?? ctx.student.nameEn
    return `DOC-001_在留資格変更許可申請書_${studentName}.xlsx`
  },
  mappings: allMappings,
}
