import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 物件更新のバリデーションスキーマ */
const updateDormitorySchema = z.object({
  name: z.string().min(1, '物件名は必須です').optional(),
  address: z.string().min(1, '住所は必須です').optional(),
  rent: z.number().min(0, '家賃は0以上を指定してください').optional(),
  gasProvider: z.string().nullable().optional(),
  gasContractNumber: z.string().nullable().optional(),
  waterProvider: z.string().nullable().optional(),
  waterContractNumber: z.string().nullable().optional(),
  electricityProvider: z.string().nullable().optional(),
  electricityContractNumber: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

/** GET /api/facilities/dormitories/:id -- 物件詳細（入居者・水光熱費付き） */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const dormitory = await prisma.dormitory.findUniqueOrThrow({
      where: { id },
      include: {
        // 入居中の学生情報
        assignments: {
          include: {
            student: {
              select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
            },
          },
          orderBy: { moveInDate: 'desc' },
        },
        // 水光熱費（直近12ヶ月分）
        utilities: {
          orderBy: { month: 'desc' },
          take: 12,
        },
      },
    })

    // Decimal → Number 変換
    const result = {
      ...dormitory,
      rent: Number(dormitory.rent),
      assignments: dormitory.assignments.map((a) => ({
        ...a,
        moveInDate: a.moveInDate.toISOString().split('T')[0],
        moveOutDate: a.moveOutDate ? a.moveOutDate.toISOString().split('T')[0] : null,
      })),
      utilities: dormitory.utilities.map((u) => ({
        ...u,
        electricity: Number(u.electricity),
        gas: Number(u.gas),
        water: Number(u.water),
      })),
    }

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/facilities/dormitories/:id -- 物件更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateDormitorySchema)

    const updated = await prisma.dormitory.update({
      where: { id },
      data: body,
    })

    return ok({ ...updated, rent: Number(updated.rent) })
  } catch (error) {
    return handleApiError(error)
  }
}
