import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 物件登録のバリデーションスキーマ */
const createDormitorySchema = z.object({
  name: z.string().min(1, '物件名は必須です'),
  address: z.string().min(1, '住所は必須です'),
  rent: z.number().min(0, '家賃は0以上を指定してください'),
  gasProvider: z.string().nullable().optional(),
  gasContractNumber: z.string().nullable().optional(),
  waterProvider: z.string().nullable().optional(),
  waterContractNumber: z.string().nullable().optional(),
  electricityProvider: z.string().nullable().optional(),
  electricityContractNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/** GET /api/facilities/dormitories -- 物件一覧（入居者数付き） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { isActive: true }

    const dormitories = await prisma.dormitory.findMany({
      where,
      include: {
        // 入居中の学生数を取得するために ACTIVE な assignment を含める
        assignments: {
          where: { status: 'ACTIVE', moveOutDate: null },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // 入居者数を算出してレスポンスに含める
    const result = dormitories.map(({ assignments, ...dormitory }) => ({
      ...dormitory,
      rent: Number(dormitory.rent),
      currentResidentCount: assignments.length,
    }))

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/facilities/dormitories -- 物件登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createDormitorySchema)

    const created = await prisma.dormitory.create({
      data: {
        name: body.name,
        address: body.address,
        rent: body.rent,
        gasProvider: body.gasProvider ?? null,
        gasContractNumber: body.gasContractNumber ?? null,
        waterProvider: body.waterProvider ?? null,
        waterContractNumber: body.waterContractNumber ?? null,
        electricityProvider: body.electricityProvider ?? null,
        electricityContractNumber: body.electricityContractNumber ?? null,
        notes: body.notes ?? null,
      },
    })

    return ok({ ...created, rent: Number(created.rent) })
  } catch (error) {
    return handleApiError(error)
  }
}
