import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 品目更新のバリデーションスキーマ */
const updateBillingItemSchema = z.object({
  name: z.string().min(1, '品目名は必須です').optional(),
  unitPrice: z.number().min(0).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

/** PUT /api/billing-items/:id -- 品目更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateBillingItemSchema)

    const updated = await prisma.billingItem.update({
      where: { id },
      data: body,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
