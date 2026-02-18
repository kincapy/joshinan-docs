import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import {
  DOC_TEMPLATE_FILES,
  TEMPLATE_BASE_DIR,
} from '@/lib/document-generator/constants'

type RouteParams = { params: Promise<{ docCode: string }> }

/**
 * GET /api/templates/:docCode
 *
 * DOCコードに対応するテンプレートファイルをダウンロードする。
 * DOC-003〜009 が対象（DOC-001 は自動生成のため対象外）。
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { docCode } = await params

    const template = DOC_TEMPLATE_FILES[docCode]
    if (!template) {
      return NextResponse.json(
        { error: { message: `テンプレート ${docCode} は存在しません` } },
        { status: 404 },
      )
    }

    // テンプレートファイルを読み込む
    const filePath = path.join(
      process.cwd(),
      TEMPLATE_BASE_DIR,
      template.fileName,
    )
    const buffer = await readFile(filePath)

    // Content-Type をファイル拡張子から判定
    const ext = path.extname(template.fileName).toLowerCase()
    const contentType = ext === '.xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : ext === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ext === '.doc'
          ? 'application/msword'
          : 'application/octet-stream'

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(template.fileName)}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
