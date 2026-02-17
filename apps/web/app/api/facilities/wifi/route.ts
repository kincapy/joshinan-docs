import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** WiFiデバイス登録のバリデーションスキーマ */
const createWifiDeviceSchema = z.object({
  imei: z.string().min(1, 'IMEIは必須です'),
  location: z.string().min(1, '配置場所は必須です'),
  contractNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/** GET /api/facilities/wifi -- WiFiデバイス一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { isActive: true }

    const devices = await prisma.wifiDevice.findMany({
      where,
      orderBy: { location: 'asc' },
    })

    return ok(devices)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/facilities/wifi -- WiFiデバイス登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createWifiDeviceSchema)

    const created = await prisma.wifiDevice.create({
      data: {
        imei: body.imei,
        location: body.location,
        contractNumber: body.contractNumber ?? null,
        notes: body.notes ?? null,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
