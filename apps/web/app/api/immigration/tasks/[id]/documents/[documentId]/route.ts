import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 書類収集状態の値一覧 */
const collectionStatusValues = [
  'NOT_COLLECTED',
  'COLLECTED',
  'AUTO_GENERATED',
] as const

/** 書類ステータス更新のバリデーションスキーマ */
const updateDocumentSchema = z.object({
  collectionStatus: z.enum(collectionStatusValues),
  notes: z.string().nullable().optional(),
})

type RouteParams = {
  params: Promise<{ id: string; documentId: string }>
}

/** PUT /api/immigration/tasks/:id/documents/:documentId — 書類収集状態の更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { documentId } = await params
    const body = await parseBody(request, updateDocumentSchema)

    const updated = await prisma.immigrationDocument.update({
      where: { id: documentId },
      data: {
        collectionStatus: body.collectionStatus,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
