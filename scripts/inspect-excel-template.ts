/**
 * DOC-001 テンプレートのセル構造調査スクリプト（改良版）
 *
 * マージセルのスレーブセルを除外し、マスターセル（左上）のみを出力する。
 * これにより、データを書き込むべきセルのアドレスを特定できる。
 *
 * 使い方: npx tsx scripts/inspect-excel-template.ts
 */

import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_PATH = path.join(
  __dirname,
  '../apps/web/templates/ssw-application/DOC-001_別記第30号_在留資格変更許可申請書.xlsx'
)

/**
 * マージセル文字列 "A1:D5" からマスターセルアドレスを取得する
 */
function getMasterCells(merges: string[]): Set<string> {
  const masters = new Set<string>()
  for (const merge of merges) {
    const [start] = merge.split(':')
    if (start) masters.add(start)
  }
  return masters
}

/**
 * セルがマージセルのスレーブ（非マスター）かどうかを判定する
 */
function isSlaveCell(cell: ExcelJS.Cell): boolean {
  // ExcelJS の Cell で isMerged プロパティがある場合、master と比較
  if (cell.isMerged && cell.master !== cell) {
    return true
  }
  return false
}

async function inspect() {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)

  console.log(`=== テンプレート: ${path.basename(TEMPLATE_PATH)} ===`)
  console.log(`シート数: ${workbook.worksheets.length}\n`)

  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`シート ${sheetId}: "${worksheet.name}"`)
    console.log(`行数: ${worksheet.rowCount}, 列数: ${worksheet.columnCount}`)

    const merges = (worksheet.model.merges || []) as string[]
    const masterCells = getMasterCells(merges)
    console.log(`マージセル数: ${merges.length}`)
    console.log(`${'='.repeat(80)}`)

    const cells: { address: string; value: string; isMerge: boolean; mergeRange?: string }[] = []

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        // マージセルのスレーブセルはスキップ
        if (isSlaveCell(cell)) return

        let value: string | undefined
        try {
          value = cell.text?.trim()
        } catch {
          return
        }
        if (value) {
          const isMerge = masterCells.has(cell.address)
          // マージ範囲を取得
          let mergeRange: string | undefined
          if (isMerge) {
            mergeRange = merges.find((m) => m.startsWith(cell.address + ':'))
          }

          cells.push({
            address: cell.address,
            value: value.substring(0, 100),
            isMerge,
            mergeRange,
          })
        }
      })
    })

    console.log(`ユニークテキストセル数: ${cells.length}\n`)

    for (const c of cells) {
      const mergeTag = c.mergeRange ? ` [${c.mergeRange}]` : ''
      console.log(`  ${c.address.padEnd(8)} ${c.value}${mergeTag}`)
    }
  })
}

inspect().catch(console.error)
