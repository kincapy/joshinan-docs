import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { generateDocumentSet } from '@/lib/document-generator'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/projects/:id/generate-documents
 *
 * プロジェクトの申請書類セットを生成してZIPでダウンロードする。
 *
 * 前提条件:
 * - REV-001 以外の全必須タスクが COMPLETED であること
 * - Student と sswField が contextData に設定されていること
 *
 * レスポンス: application/zip バイナリ
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    // 前提条件チェック: 全必須タスクが完了しているか確認
    const tasks = await prisma.projectTask.findMany({
      where: { projectId: id },
      select: {
        taskCode: true,
        status: true,
        required: true,
      },
    })

    // REV-001 以外の必須タスクが全て COMPLETED かチェック
    const incompleteTasks = tasks.filter(
      (t) => t.required && t.taskCode !== 'REV-001' && t.status !== 'COMPLETED',
    )

    if (incompleteTasks.length > 0) {
      const codes = incompleteTasks.map((t) => t.taskCode).join(', ')
      return NextResponse.json(
        {
          error: '未完了のタスクがあります',
          message: `以下のタスクが完了していません: ${codes}`,
          incompleteTasks: incompleteTasks.map((t) => t.taskCode),
        },
        { status: 400 },
      )
    }

    // 書類生成
    const result = await generateDocumentSet(id)

    // ZIP バイナリをレスポンスとして返す
    // NextResponse は Uint8Array を受け付けるが Node.js Buffer はそのまま渡せないため変換
    const body = new Uint8Array(result.buffer)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.fileName)}"`,
        'Content-Length': String(result.buffer.length),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
