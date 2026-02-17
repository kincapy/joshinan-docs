import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 品目登録のバリデーションスキーマ */
const createBillingItemSchema = z.object({
  name: z.string().min(1, '品目名は必須です'),
  unitPrice: z.number().min(0, '単価は0以上を指定してください').nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
})

/** GET /api/billing-items -- 品目マスタ一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // 有効な品目のみ or 全品目を表示順で返す
    const where = includeInactive ? {} : { isActive: true }

    const items = await prisma.billingItem.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    })

    return ok(items)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/billing-items -- 品目登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createBillingItemSchema)

    const created = await prisma.billingItem.create({
      data: {
        name: body.name,
        unitPrice: body.unitPrice ?? null,
        displayOrder: body.displayOrder ?? 0,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
