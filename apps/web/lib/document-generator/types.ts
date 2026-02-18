import type { Gender, SswField } from '@joshinan/database'

/**
 * 書類生成に必要な全データを集約した型
 *
 * Student + Company + プロジェクト情報 + 登録支援機関固定情報を1つにまとめ、
 * マッピング定義から参照しやすくする。
 */
export type DocumentContext = {
  /** 学生情報（Student テーブルから取得） */
  student: StudentData
  /** 受入れ企業情報（Company テーブルから取得） */
  company: CompanyData
  /** プロジェクト情報（Project + contextData から取得） */
  project: ProjectData
  /** 登録支援機関の固定情報（常南交通） */
  supportOrg: SupportOrgData
}

/** Student テーブルから取得する書類生成に必要なフィールド */
export type StudentData = {
  /** 氏名（漢字）。漢字圏以外は null */
  nameKanji: string | null
  /** 氏名（カナ） */
  nameKana: string | null
  /** 氏名（英語）。パスポート記載名 */
  nameEn: string
  /** 生年月日 */
  dateOfBirth: Date
  /** 性別 */
  gender: Gender
  /** 国籍 */
  nationality: string
  /** 日本の住所 */
  addressJapan: string | null
  /** 電話番号 */
  phone: string | null
  /** パスポート番号 */
  passportNumber: string | null
  /** 在留カード番号 */
  residenceCardNumber: string | null
  /** 在留資格（「留学」が基本） */
  residenceStatus: string | null
  /** 在留期限 */
  residenceExpiry: Date | null
  /** 入国日 */
  entryDate: Date | null
  /** 資格証情報（JLPT・特定技能試験等） */
  certifications: CertificationData[]
}

/** 資格証データ */
export type CertificationData = {
  /** 試験種別（JLPT, SSW_SKILL 等） */
  examType: string
  /** レベル・級（N1〜N5、業種名など） */
  level: string | null
  /** 受験日 */
  examDate: Date
  /** 合否 */
  result: string
  /** 証明書番号 */
  certificateNumber: string | null
}

/** Company テーブルから取得する書類生成に必要なフィールド */
export type CompanyData = {
  /** 企業名 */
  name: string
  /** 代表者名 */
  representative: string
  /** 郵便番号 */
  postalCode: string | null
  /** 所在地 */
  address: string
  /** 電話番号 */
  phone: string
  /** 分野 */
  field: SswField
  /** 営業許可（旅館業許可等） */
  businessLicense: string | null
  /** 法人番号（13桁） */
  corporateNumber: string | null
  /** 設立年月日 */
  establishedDate: Date | null
}

/** プロジェクトの contextData から取得する情報 */
export type ProjectData = {
  /** プロジェクトID */
  projectId: string
  /** プロジェクト名 */
  projectName: string
  /** 学生ID */
  studentId: string
  /** 企業ID（DAT-001 入力後に設定） */
  companyId: string | null
  /** 特定技能分野 */
  sswField: SswField
  /** 国籍（条件分岐用に contextData に保存済み） */
  nationality: string
}

/** 登録支援機関（常南交通）の固定情報 */
export type SupportOrgData = {
  /** 機関名 */
  name: string
  /** 登録番号 */
  registrationNumber: string
  /** 法人番号 */
  corporateNumber: string
  /** 所在地 */
  address: string
  /** 郵便番号 */
  postalCode: string
  /** 電話番号 */
  phone: string
  /** 代表者 */
  representative: string
  /** 支援責任者 */
  supportManager: string
  /** 振込先 */
  bankAccount: string
}

// ============================================================
// Excel セルマッピング定義の型
// ============================================================

/**
 * Excel の1セルに対応するマッピング定義
 *
 * テンプレートの特定セルに、DocumentContext からどの値を書き込むかを定義する。
 * getValue 関数で変換ロジック（日付フォーマット、国籍コード→名称変換等）を記述できる。
 */
export type ExcelCellMapping = {
  /** 対象シート名 */
  sheetName: string
  /** セルアドレス（例: "B3", "D15"） */
  cell: string
  /** DocumentContext から値を取得する関数 */
  getValue: (ctx: DocumentContext) => string | number | Date | null | undefined
  /**
   * セルの書式（オプション）
   * - 'text': 文字列として書込み（デフォルト）
   * - 'date': 日付として書込み
   * - 'number': 数値として書込み
   */
  format?: 'text' | 'date' | 'number'
}

/**
 * 書類1つの定義
 *
 * テンプレートファイル名・出力ファイル名・マッピング定義を持つ。
 * 1書類 = 1テンプレート = 1出力ファイル。
 */
export type DocumentDefinition = {
  /** 書類コード（DOC-001 等） */
  docCode: string
  /** 書類名（日本語） */
  docName: string
  /** テンプレートファイル名（apps/web/templates/ssw-application/ 内のファイル名） */
  templateFileName: string
  /** 出力ファイル名（ZIP 内のファイル名）。contextData を使って動的に生成可能 */
  getOutputFileName: (ctx: DocumentContext) => string
  /** セルマッピング定義 */
  mappings: ExcelCellMapping[]
}

/**
 * 書類生成の結果
 */
export type GeneratedDocument = {
  /** 書類コード */
  docCode: string
  /** 出力ファイル名 */
  fileName: string
  /** Excel バイナリ（Buffer） */
  buffer: Buffer
}
