import JSZip from 'jszip'
import { collectDocumentData } from './data-collector'
import { generateMultipleExcels } from './excel-generator'
import { DOC_001 } from './mappings/doc-001'
import type { DocumentDefinition, GeneratedDocument } from './types'

/**
 * Phase 1 で対応する書類定義の一覧
 *
 * DOC-001 のみ。Phase 2 以降で DOC-003 〜 DOC-013 を追加する。
 */
const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  DOC_001,
]

/**
 * プロジェクトの申請書類セットを一括生成する
 *
 * 1. プロジェクトIDから必要なデータを収集（Student, Company, contextData）
 * 2. 各書類定義に基づいてExcelファイルを生成
 * 3. 全ファイルをZIPにまとめて返す
 *
 * @param projectId プロジェクトID
 * @returns ZIP バイナリの Buffer
 */
export async function generateDocumentSet(projectId: string): Promise<{
  /** ZIP ファイルの Buffer */
  buffer: Buffer
  /** ZIP ファイル名 */
  fileName: string
  /** 生成された書類の一覧 */
  documents: { docCode: string; fileName: string }[]
}> {
  // 1. データ収集
  const context = await collectDocumentData(projectId)

  // 2. Excel 生成
  const generatedDocs = await generateMultipleExcels(DOCUMENT_DEFINITIONS, context)

  if (generatedDocs.length === 0) {
    throw new Error('書類を1つも生成できませんでした。テンプレートファイルの存在を確認してください。')
  }

  // 3. ZIP 化
  const zip = new JSZip()
  for (const doc of generatedDocs) {
    zip.file(doc.fileName, doc.buffer)
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // ZIP ファイル名を生成（学生名 + 日付）
  const studentName = context.student.nameKanji ?? context.student.nameEn
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const zipFileName = `申請書類_${studentName}_${today}.zip`

  return {
    buffer: zipBuffer,
    fileName: zipFileName,
    documents: generatedDocs.map((d) => ({
      docCode: d.docCode,
      fileName: d.fileName,
    })),
  }
}

/** 型の再エクスポート */
export type { DocumentContext, GeneratedDocument } from './types'
