/**
 * 企業アンケートExcelフォーム生成
 *
 * 所属機関概要書（DOC-006）等の書類で必要な企業情報を
 * 企業に記入してもらうためのExcelフォームを生成する。
 */
import ExcelJS from 'exceljs'

// --- セルの行番号定義（パーサーと共有するためエクスポート） ---

/** セクション1: 企業追加情報の開始行 */
export const ROW_SECTION1_START = 6
/** 事業内容 */
export const ROW_BUSINESS_DESC = 6
/** 資本金 */
export const ROW_CAPITAL = 7
/** 常勤職員数 */
export const ROW_EMPLOYEES = 8
/** 担当者名 */
export const ROW_CONTACT_PERSON = 9
/** 担当者メール */
export const ROW_CONTACT_EMAIL = 10
/** FAX番号 */
export const ROW_FAX = 11

/** セクション2: 役員情報のヘッダー行 */
export const ROW_OFFICERS_HEADER = 14
/** 役員データの開始行 */
export const ROW_OFFICERS_START = 15
/** 役員の最大行数 */
export const OFFICERS_MAX_ROWS = 10

/** セクション3: 決算情報のヘッダー行 */
export const ROW_FINANCIALS_HEADER = 27
/** 決算データの開始行 */
export const ROW_FINANCIALS_START = 28
/** 決算の年数 */
export const FINANCIALS_YEARS = 3

/** 隠しデータ列 */
export const COL_HIDDEN_ID = 'Z'

/** シート名 */
export const SHEET_NAME = 'アンケート'

// --- 型定義 ---

export type SurveyCompanyData = {
  id: string
  name: string
  corporateNumber: string | null
  businessDescription: string | null
  capitalAmount: bigint | string | null
  fullTimeEmployees: number | null
  contactPerson: string | null
  contactEmail: string | null
  faxNumber: string | null
}

export type SurveyOfficerData = {
  name: string
  nameKana: string
  position: string
}

export type SurveyFinancialData = {
  fiscalYear: number
  revenue: bigint | string | null
  ordinaryIncome: bigint | string | null
}

export type SurveyGenerateInput = {
  company: SurveyCompanyData
  officers: SurveyOfficerData[]
  financials: SurveyFinancialData[]
}

// --- スタイル定数 ---

const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: 'Yu Gothic',
  size: 14,
  bold: true,
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Yu Gothic',
  size: 11,
  bold: true,
}

const LABEL_FONT: Partial<ExcelJS.Font> = {
  name: 'Yu Gothic',
  size: 10,
}

const INPUT_FONT: Partial<ExcelJS.Font> = {
  name: 'Yu Gothic',
  size: 10,
}

/** 入力欄の背景色（薄黄色） */
const INPUT_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF8E1' },
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE3F2FD' },
}

const THIN_BORDER: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FFB0BEC5' },
}

const ALL_BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
}

// --- 生成関数 ---

/**
 * 企業アンケート Excel ワークブックを生成する
 * 既存データがある場合は pre-fill する
 */
export async function generateSurveyWorkbook(
  input: SurveyGenerateInput,
): Promise<ExcelJS.Workbook> {
  const { company, officers, financials } = input
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '常南国際学院'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ showGridLines: false }],
  })

  // 列幅の設定
  sheet.columns = [
    { width: 20 },  // A: ラベル
    { width: 30 },  // B: 入力欄1
    { width: 25 },  // C: 入力欄2
  ]

  // --- タイトル・企業情報 ---
  buildTitleSection(sheet, company)

  // --- セクション1: 企業追加情報 ---
  buildCompanyInfoSection(sheet, company)

  // --- セクション2: 役員情報 ---
  buildOfficersSection(sheet, officers)

  // --- セクション3: 決算情報 ---
  buildFinancialsSection(sheet, financials)

  // --- 隠しデータ（企業ID） ---
  sheet.getCell(`${COL_HIDDEN_ID}1`).value = company.id
  sheet.getColumn(colToIndex(COL_HIDDEN_ID)).hidden = true

  return workbook
}

// --- セクション構築関数 ---

function buildTitleSection(
  sheet: ExcelJS.Worksheet,
  company: SurveyCompanyData,
) {
  // タイトル行
  sheet.mergeCells('A1:C1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = '常南国際学院 企業情報アンケート'
  titleCell.font = TITLE_FONT

  // 企業名（参照表示）
  const nameCell = sheet.getCell('A2')
  nameCell.value = `企業名: ${company.name}`
  nameCell.font = { ...LABEL_FONT, bold: true }

  // 法人番号（参照表示）
  if (company.corporateNumber) {
    const corpCell = sheet.getCell('A3')
    corpCell.value = `法人番号: ${company.corporateNumber}`
    corpCell.font = LABEL_FONT
  }
}

function buildCompanyInfoSection(
  sheet: ExcelJS.Worksheet,
  company: SurveyCompanyData,
) {
  // セクションヘッダー
  sheet.mergeCells('A5:C5')
  const headerCell = sheet.getCell('A5')
  headerCell.value = '■ 企業情報'
  headerCell.font = HEADER_FONT

  const fields = [
    { row: ROW_BUSINESS_DESC, label: '事業内容', value: company.businessDescription },
    { row: ROW_CAPITAL, label: '資本金（円）', value: toBigIntDisplay(company.capitalAmount) },
    { row: ROW_EMPLOYEES, label: '常勤職員数', value: company.fullTimeEmployees },
    { row: ROW_CONTACT_PERSON, label: '担当者名', value: company.contactPerson },
    { row: ROW_CONTACT_EMAIL, label: '担当者メールアドレス', value: company.contactEmail },
    { row: ROW_FAX, label: 'FAX番号', value: company.faxNumber },
  ]

  for (const field of fields) {
    const labelCell = sheet.getCell(`A${field.row}`)
    labelCell.value = field.label
    labelCell.font = LABEL_FONT
    labelCell.border = ALL_BORDERS

    const inputCell = sheet.getCell(`B${field.row}`)
    if (field.value != null) {
      inputCell.value = typeof field.value === 'number'
        ? field.value
        : field.value.toString()
    }
    inputCell.font = INPUT_FONT
    inputCell.fill = INPUT_FILL
    inputCell.border = ALL_BORDERS

    // 数値フィールドにはカンマ区切りフォーマット
    if (field.label.includes('円') || field.label === '常勤職員数') {
      inputCell.numFmt = '#,##0'
    }
  }
}

function buildOfficersSection(
  sheet: ExcelJS.Worksheet,
  officers: SurveyOfficerData[],
) {
  // セクションヘッダー
  sheet.mergeCells('A13:C13')
  const headerCell = sheet.getCell('A13')
  headerCell.value = '■ 役員情報（代表取締役を含むすべての役員を記入してください）'
  headerCell.font = HEADER_FONT

  // テーブルヘッダー
  const headers = [
    { col: 'A', label: '氏名' },
    { col: 'B', label: 'ふりがな' },
    { col: 'C', label: '役職' },
  ]
  for (const h of headers) {
    const cell = sheet.getCell(`${h.col}${ROW_OFFICERS_HEADER}`)
    cell.value = h.label
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.border = ALL_BORDERS
  }

  // 入力行（10行分）
  for (let i = 0; i < OFFICERS_MAX_ROWS; i++) {
    const row = ROW_OFFICERS_START + i
    const officer = officers[i]

    for (const col of ['A', 'B', 'C'] as const) {
      const cell = sheet.getCell(`${col}${row}`)
      cell.font = INPUT_FONT
      cell.fill = INPUT_FILL
      cell.border = ALL_BORDERS
    }

    // 既存データがあれば pre-fill
    if (officer) {
      sheet.getCell(`A${row}`).value = officer.name
      sheet.getCell(`B${row}`).value = officer.nameKana
      sheet.getCell(`C${row}`).value = officer.position
    }
  }
}

function buildFinancialsSection(
  sheet: ExcelJS.Worksheet,
  financials: SurveyFinancialData[],
) {
  // セクションヘッダー
  sheet.mergeCells('A26:C26')
  const headerCell = sheet.getCell('A26')
  headerCell.value = '■ 決算状況（直近3年分）'
  headerCell.font = HEADER_FONT

  // テーブルヘッダー
  const headers = [
    { col: 'A', label: '年度' },
    { col: 'B', label: '売上高（円）' },
    { col: 'C', label: '経常利益（円）' },
  ]
  for (const h of headers) {
    const cell = sheet.getCell(`${h.col}${ROW_FINANCIALS_HEADER}`)
    cell.value = h.label
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.border = ALL_BORDERS
  }

  // 直近3年分の行を作成
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < FINANCIALS_YEARS; i++) {
    const row = ROW_FINANCIALS_START + i
    const year = currentYear - 1 - i
    const financial = financials.find((f) => f.fiscalYear === year)

    // 年度ラベル
    const yearCell = sheet.getCell(`A${row}`)
    yearCell.value = `${year}年度`
    yearCell.font = LABEL_FONT
    yearCell.border = ALL_BORDERS

    // 売上高
    const revenueCell = sheet.getCell(`B${row}`)
    if (financial?.revenue != null) {
      revenueCell.value = Number(financial.revenue)
    }
    revenueCell.font = INPUT_FONT
    revenueCell.fill = INPUT_FILL
    revenueCell.border = ALL_BORDERS
    revenueCell.numFmt = '#,##0'

    // 経常利益
    const incomeCell = sheet.getCell(`C${row}`)
    if (financial?.ordinaryIncome != null) {
      incomeCell.value = Number(financial.ordinaryIncome)
    }
    incomeCell.font = INPUT_FONT
    incomeCell.fill = INPUT_FILL
    incomeCell.border = ALL_BORDERS
    incomeCell.numFmt = '#,##0'
  }
}

// --- ユーティリティ ---

/** BigInt/string を表示用の数値に変換 */
function toBigIntDisplay(value: bigint | string | null | undefined): number | null {
  if (value == null) return null
  return Number(value)
}

/** 列文字をインデックスに変換（A=1, B=2, ..., Z=26） */
function colToIndex(col: string): number {
  return col.charCodeAt(0) - 'A'.charCodeAt(0) + 1
}
