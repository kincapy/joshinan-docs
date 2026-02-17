import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** WiFiデバイス更新のバリデーションスキーマ */
const updateWifiDeviceSchema = z.object({
  imei: z.string().min(1, 'IMEIは必須です').optional(),
  location: z.string().min(1, '配置場所は必須です').optional(),
  contractNumber: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

/** PUT /api/facilities/wifi/:id -- WiFiデバイス更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateWifiDeviceSchema)

    const updated = await prisma.wifiDevice.update({
      where: { id },
      data: body,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
