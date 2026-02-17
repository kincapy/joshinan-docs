import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string; docId: string }> }

/** 書類ステータス更新スキーマ */
const updateDocumentSchema = z.object({
  status: z
    .enum([
      'NOT_STARTED',
      'DRAFTING',
      'REQUESTED',
      'COLLECTED',
      'AUTO_FILLED',
      'PENDING_REVIEW',
      'COMPLETED',
      'NOT_REQUIRED',
      'RETURNED',
    ])
    .optional(),
  notes: z.string().optional().nullable(),
  skipReason: z.string().optional().nullable(),
})

/**
 * PUT /api/ssw/cases/:id/documents/:docId - 書類ステータス更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id, docId } = await params
    const body = await parseBody(request, updateDocumentSchema)

    // 書類が指定の案件に属しているか確認
    const document = await prisma.caseDocument.findFirst({
      where: { id: docId, caseId: id },
    })
    if (!document) {
      return errorResponse('書類が見つかりません', 404)
    }

    const updated = await prisma.caseDocument.update({
      where: { id: docId },
      data: body,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
