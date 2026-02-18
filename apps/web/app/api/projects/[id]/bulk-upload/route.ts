import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { analyzeDocuments } from '@/lib/project/document-analyzer'

type RouteParams = { params: Promise<{ id: string }> }

/** 一括アップロード解析リクエストのスキーマ */
const bulkAnalyzeSchema = z.object({
  /** アップロードされたファイル情報の配列 */
  files: z.array(z.object({
    /** ファイル名 */
    fileName: z.string(),
    /** ファイルの一時保存パス or Base64エンコードされた内容 */
    content: z.string(),
    /** MIMEタイプ */
    mimeType: z.string(),
  })).min(1, '1件以上のファイルが必要です'),
})

/** 一括格納リクエストのスキーマ */
const bulkConfirmSchema = z.object({
  /** 各ファイルの格納先 */
  assignments: z.array(z.object({
    /** ファイル名 */
    fileName: z.string(),
    /** ファイルパス（保存先） */
    filePath: z.string(),
    /** 格納先タスクのID */
    taskId: z.string().uuid(),
  })),
})

/**
 * POST /api/projects/:id/bulk-upload -- 書類一括アップロード解析
 *
 * アップロードされたファイル群をClaude APIで解析し、
 * 各ファイルの振り分け先タスクコードと信頼度を返す。
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, bulkAnalyzeSchema)

    // プロジェクトとタスク一覧を取得（振り分け先の候補として使う）
    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        tasks: {
          where: { status: { not: 'NOT_REQUIRED' } },
          select: {
            id: true,
            taskCode: true,
            taskName: true,
            filePath: true,
          },
          orderBy: { taskCode: 'asc' },
        },
      },
    })

    // Claude API で書類を解析し、振り分け先を提案する
    const analysisResults = await analyzeDocuments(
      body.files,
      project.tasks.map((t) => ({
        id: t.id,
        taskCode: t.taskCode,
        taskName: t.taskName,
        hasFile: !!t.filePath,
      })),
    )

    // フロントで振り分け先を変更できるよう、タスク一覧も返す
    const taskOptions = project.tasks.map((t) => ({
      id: t.id,
      taskCode: t.taskCode,
      taskName: t.taskName,
    }))

    return ok({
      projectId: id,
      results: analysisResults,
      tasks: taskOptions,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/projects/:id/bulk-upload -- 書類一括格納（解析結果の確定）
 *
 * ユーザーが確認した振り分け結果に基づいて、
 * 各タスクにファイルを格納し、ステータスを更新する。
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await parseBody(request, bulkConfirmSchema)

    // プロジェクトの存在確認
    await prisma.project.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    })

    // 各タスクにファイルを格納し、ステータスを更新する
    const results = await Promise.all(
      body.assignments.map(async (assignment) => {
        // 現在のタスク状態を取得
        const currentTask = await prisma.projectTask.findUniqueOrThrow({
          where: { id: assignment.taskId },
          select: { status: true },
        })

        // ファイルパスを更新
        const updated = await prisma.projectTask.update({
          where: { id: assignment.taskId },
          data: { filePath: assignment.filePath },
        })

        // 未着手のタスクは対応中に自動変更する
        if (currentTask.status === 'NOT_STARTED') {
          await prisma.projectTask.update({
            where: { id: assignment.taskId },
            data: { status: 'IN_PROGRESS' },
          })

          // ステータス変更履歴を記録
          await prisma.projectTaskStatusLog.create({
            data: {
              taskId: assignment.taskId,
              fromStatus: 'NOT_STARTED',
              toStatus: 'IN_PROGRESS',
              changedById: user.id,
            },
          })
        }

        return {
          taskId: updated.id,
          taskCode: updated.taskCode,
          fileName: assignment.fileName,
          filePath: assignment.filePath,
        }
      }),
    )

    return ok({ stored: results })
  } catch (error) {
    return handleApiError(error)
  }
}
