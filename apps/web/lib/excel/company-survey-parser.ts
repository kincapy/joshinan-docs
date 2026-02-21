/**
 * 企業アンケートExcelパーサー
 *
 * アップロードされた Excel ファイルからデータを読み取り、
 * 企業の追加情報・役員情報・決算情報として構造化する。
 */
import ExcelJS from 'exceljs'
import {
  SHEET_NAME,
  COL_HIDDEN_ID,
  ROW_BUSINESS_DESC,
  ROW_CAPITAL,
  ROW_EMPLOYEES,
  ROW_CONTACT_PERSON,
  ROW_CONTACT_EMAIL,
  ROW_FAX,
  ROW_OFFICERS_START,
  OFFICERS_MAX_ROWS,
  ROW_FINANCIALS_START,
  FINANCIALS_YEARS,
} from './company-survey'

// --- 型定義 ---

export type ParsedSurvey = {
  companyId: string
  businessDescription: string | null
  capitalAmount: bigint | null
  fullTimeEmployees: number | null
  contactPerson: string | null
  contactEmail: string | null
  faxNumber: string | null
  officers: ParsedOfficer[]
  financials: ParsedFinancial[]
}

export type ParsedOfficer = {
  name: string
  nameKana: string
  position: string
  sortOrder: number
}

export type ParsedFinancial = {
  fiscalYear: number
  revenue: bigint | null
  ordinaryIncome: bigint | null
}

// --- パース関数 ---

/**
 * アップロードされた Excel バッファをパースして構造化データを返す
 * @throws Error フォーマット不正や必須データ不足の場合
 */
export async function parseSurveyWorkbook(
  buffer: Buffer,
): Promise<ParsedSurvey> {
  const workbook = new ExcelJS.Workbook()
  // ExcelJS の型定義と Node.js の Buffer 型の互換性のため ArrayBuffer を経由
  await workbook.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer)

  const sheet = workbook.getWorksheet(SHEET_NAME)
  if (!sheet) {
    throw new Error(`「${SHEET_NAME}」シートが見つかりません。正しいファイルをアップロードしてください。`)
  }

  // 企業ID（隠し列から取得）
  const companyId = readCellString(sheet, `${COL_HIDDEN_ID}1`)
  if (!companyId) {
    throw new Error('企業IDが見つかりません。ダウンロードしたファイルを使用してください。')
  }

  // セクション1: 企業追加情報
  const businessDescription = readCellString(sheet, `B${ROW_BUSINESS_DESC}`)
  const capitalAmount = readCellBigInt(sheet, `B${ROW_CAPITAL}`)
  const fullTimeEmployees = readCellInt(sheet, `B${ROW_EMPLOYEES}`)
  const contactPerson = readCellString(sheet, `B${ROW_CONTACT_PERSON}`)
  const contactEmail = readCellString(sheet, `B${ROW_CONTACT_EMAIL}`)
  const faxNumber = readCellString(sheet, `B${ROW_FAX}`)

  // セクション2: 役員情報（空行はスキップ）
  const officers: ParsedOfficer[] = []
  for (let i = 0; i < OFFICERS_MAX_ROWS; i++) {
    const row = ROW_OFFICERS_START + i
    const name = readCellString(sheet, `A${row}`)
    const nameKana = readCellString(sheet, `B${row}`)
    const position = readCellString(sheet, `C${row}`)

    // 氏名が入力されていれば有効な行として扱う
    if (name) {
      officers.push({
        name,
        nameKana: nameKana || '',
        position: position || '',
        sortOrder: i,
      })
    }
  }

  // セクション3: 決算情報
  const financials: ParsedFinancial[] = []
  for (let i = 0; i < FINANCIALS_YEARS; i++) {
    const row = ROW_FINANCIALS_START + i
    const yearStr = readCellString(sheet, `A${row}`)
    const revenue = readCellBigInt(sheet, `B${row}`)
    const ordinaryIncome = readCellBigInt(sheet, `C${row}`)

    // 年度を数値に変換（「2025年度」→ 2025）
    const fiscalYear = extractYear(yearStr)
    if (!fiscalYear) continue

    // 売上高または経常利益のどちらかが入力されていれば有効
    if (revenue != null || ordinaryIncome != null) {
      financials.push({ fiscalYear, revenue, ordinaryIncome })
    }
  }

  return {
    companyId,
    businessDescription,
    capitalAmount,
    fullTimeEmployees,
    contactPerson,
    contactEmail,
    faxNumber,
    officers,
    financials,
  }
}

// --- セル読み取りユーティリティ ---

/** セルから文字列を読み取る（空文字は null） */
function readCellString(
  sheet: ExcelJS.Worksheet,
  address: string,
): string | null {
  const cell = sheet.getCell(address)
  const value = cell.value
  if (value == null) return null

  // ExcelJS は富テキスト（richText）を返す場合がある
  if (typeof value === 'object' && 'richText' in value) {
    const text = (value as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join('')
    return text.trim() || null
  }

  const str = String(value).trim()
  return str || null
}

/** セルから整数を読み取る */
function readCellInt(
  sheet: ExcelJS.Worksheet,
  address: string,
): number | null {
  const cell = sheet.getCell(address)
  const value = cell.value
  if (value == null) return null

  const num = Number(value)
  if (isNaN(num)) return null
  return Math.round(num)
}

/** セルから BigInt を読み取る（金額など大きな数値用） */
function readCellBigInt(
  sheet: ExcelJS.Worksheet,
  address: string,
): bigint | null {
  const cell = sheet.getCell(address)
  const value = cell.value
  if (value == null) return null

  // 数値型の場合
  if (typeof value === 'number') {
    return BigInt(Math.round(value))
  }

  // 文字列の場合（カンマ区切りを除去）
  const str = String(value).replace(/[,，、\s]/g, '').trim()
  if (!str || isNaN(Number(str))) return null
  return BigInt(Math.round(Number(str)))
}

/** 年度文字列から西暦年を抽出（「2025年度」→ 2025） */
function extractYear(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/(\d{4})/)
  return match ? Number(match[1]) : null
}
