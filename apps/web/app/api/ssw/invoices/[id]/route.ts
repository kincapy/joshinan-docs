import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 請求ステータス更新スキーマ */
const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'OVERDUE']).optional(),
  notes: z.string().optional().nullable(),
})

/**
 * PUT /api/ssw/invoices/:id - 請求ステータス更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateInvoiceSchema)

    const existing = await prisma.sswInvoice.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('請求が見つかりません', 404)
    }

    const updated = await prisma.sswInvoice.update({
      where: { id },
      data: body,
      include: {
        sswCase: {
          select: {
            id: true,
            student: {
              select: { id: true, nameEn: true, nameKanji: true },
            },
          },
        },
        company: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
