import ExcelJS from 'exceljs'
import path from 'path'
import type { DocumentDefinition, DocumentContext, GeneratedDocument, ExcelCellMapping } from './types'
import { TEMPLATE_BASE_DIR } from './constants'

/**
 * テンプレートファイルのフルパスを取得する
 *
 * Next.js の実行環境に応じてパスを解決する。
 * - 開発時: process.cwd() は apps/web/ のルート
 * - Vercel: outputFileTracingIncludes でバンドルされたパス
 */
function getTemplatePath(fileName: string): string {
  return path.join(process.cwd(), TEMPLATE_BASE_DIR, fileName)
}

/**
 * 1つの書類定義に基づいてExcelファイルを生成する
 *
 * 1. テンプレートファイルを読み込む
 * 2. マッピング定義に従って各セルにデータを書き込む
 * 3. Buffer として返す
 *
 * マージセル対策:
 * - ExcelJS ではマージセルの左上セルに値を書き込めばよい
 * - マージプロパティ自体は変更しない（テンプレートの書式を保持）
 */
export async function generateExcel(
  definition: DocumentDefinition,
  context: DocumentContext,
): Promise<GeneratedDocument> {
  const templatePath = getTemplatePath(definition.templateFileName)

  // テンプレートを読み込む
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  // マッピングに従ってセルに値を書き込む
  for (const mapping of definition.mappings) {
    writeCell(workbook, mapping, context)
  }

  // Buffer として出力
  const buffer = await workbook.xlsx.writeBuffer()

  return {
    docCode: definition.docCode,
    fileName: definition.getOutputFileName(context),
    buffer: Buffer.from(buffer),
  }
}

/**
 * 1つのセルにデータを書き込む
 *
 * - sheetName でシートを特定
 * - cell でセルアドレスを特定
 * - getValue() で DocumentContext から値を取得
 * - null/undefined の場合は何も書き込まない（テンプレートの元の値を保持）
 */
function writeCell(
  workbook: ExcelJS.Workbook,
  mapping: ExcelCellMapping,
  context: DocumentContext,
): void {
  const worksheet = workbook.getWorksheet(mapping.sheetName)
  if (!worksheet) {
    // シートが見つからない場合はスキップ（警告のみ）
    console.warn(`[document-generator] シート "${mapping.sheetName}" が見つかりません`)
    return
  }

  // getValue() で値を取得
  let value: string | number | Date | null | undefined
  try {
    value = mapping.getValue(context)
  } catch (error) {
    // getValue() でエラーが発生した場合はスキップ
    console.warn(
      `[document-generator] セル ${mapping.sheetName}!${mapping.cell} の値取得でエラー:`,
      error,
    )
    return
  }

  // null/undefined の場合は何も書き込まない
  if (value === null || value === undefined || value === '') {
    return
  }

  const cell = worksheet.getCell(mapping.cell)

  // マージセルの場合、セルが master でないとき → master セルに書き込む
  // ExcelJS では getCell で左上セルを取得すればそのまま書き込める
  switch (mapping.format) {
    case 'date':
      cell.value = value instanceof Date ? value : new Date(String(value))
      break
    case 'number':
      cell.value = typeof value === 'number' ? value : Number(value)
      break
    default:
      // テキストとして書き込む
      cell.value = String(value)
  }
}

/**
 * 複数の書類定義に基づいてExcelファイルを一括生成する
 */
export async function generateMultipleExcels(
  definitions: DocumentDefinition[],
  context: DocumentContext,
): Promise<GeneratedDocument[]> {
  const results: GeneratedDocument[] = []

  for (const definition of definitions) {
    try {
      const doc = await generateExcel(definition, context)
      results.push(doc)
    } catch (error) {
      console.error(
        `[document-generator] ${definition.docCode} の生成でエラー:`,
        error,
      )
      // エラーが発生した書類はスキップして他の書類の生成を続行
    }
  }

  return results
}
