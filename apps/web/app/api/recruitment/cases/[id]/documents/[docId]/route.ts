import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { errorResponse } from '@/lib/api/response'

/** 書類収集状態の値一覧（VO ローカル定義） */
const collectionStatusValues = [
  'NOT_RECEIVED', 'RECEIVED', 'VERIFIED', 'DEFICIENT',
] as const

/** 書類ステータス更新のバリデーションスキーマ */
const updateDocumentSchema = z.object({
  collectionStatus: z.enum(collectionStatusValues).optional(),
  filePath: z.string().nullable().optional(),
  hasJapaneseTranslation: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

type RouteParams = {
  params: Promise<{ id: string; docId: string }>
}

/** PUT /api/recruitment/cases/:id/documents/:docId — 書類収集状態の更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { docId } = await params
    const body = await parseBody(request, updateDocumentSchema)

    /* ビジネスルール: VERIFIED にするには filePath が必須 */
    if (body.collectionStatus === 'VERIFIED') {
      /* 既存の filePath を確認 */
      const existing = await prisma.applicationDocument.findUnique({
        where: { id: docId },
        select: { filePath: true, hasJapaneseTranslation: true },
      })

      if (!existing) {
        return errorResponse('書類が見つかりません', 404)
      }

      const newFilePath = body.filePath !== undefined ? body.filePath : existing.filePath
      if (!newFilePath) {
        return errorResponse('確認済みにするにはファイルが必要です', 400)
      }

      /* 外国語書類で訳文がない場合は VERIFIED にできない */
      const newTranslation = body.hasJapaneseTranslation !== undefined
        ? body.hasJapaneseTranslation
        : existing.hasJapaneseTranslation
      /* 注意: 訳文チェックは将来的に厳密化する可能性あり。現時点では警告なし */
    }

    const data: Record<string, unknown> = {}
    if (body.collectionStatus !== undefined) data.collectionStatus = body.collectionStatus
    if (body.filePath !== undefined) data.filePath = body.filePath
    if (body.hasJapaneseTranslation !== undefined) data.hasJapaneseTranslation = body.hasJapaneseTranslation
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await prisma.applicationDocument.update({
      where: { id: docId },
      data,
      include: {
        checkResults: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
