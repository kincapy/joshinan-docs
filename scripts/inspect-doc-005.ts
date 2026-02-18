/**
 * DOC-005 テンプレートのセル構造調査スクリプト
 */

import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_PATH = path.join(
  __dirname,
  '../apps/web/templates/ssw-application/DOC-005_第1-17号_支援計画書.xlsx'
)

function isSlaveCell(cell: ExcelJS.Cell): boolean {
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
    console.log(`\n${'='.repeat(60)}`)
    console.log(`シート ${sheetId}: "${worksheet.name}"`)
    console.log(`行数: ${worksheet.rowCount}, 列数: ${worksheet.columnCount}`)

    const merges = (worksheet.model.merges || []) as string[]
    console.log(`マージセル数: ${merges.length}`)
    console.log(`${'='.repeat(60)}`)

    let count = 0
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (isSlaveCell(cell)) return

        let value: string | undefined
        try {
          value = cell.text?.trim()
        } catch {
          return
        }
        if (value) {
          count++
          console.log(`  ${cell.address.padEnd(8)} ${value.substring(0, 100)}`)
        }
      })
    })
    console.log(`テキストセル数: ${count}`)
  })
}

inspect().catch(console.error)
