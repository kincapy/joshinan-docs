import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 水光熱費一括入力のバリデーションスキーマ */
const batchUtilitySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, '年月は YYYY-MM 形式で指定してください'),
  entries: z.array(z.object({
    dormitoryId: z.string().uuid('寮IDが無効です'),
    electricity: z.number().min(0, '電気代は0以上を指定してください'),
    gas: z.number().min(0, 'ガス代は0以上を指定してください'),
    water: z.number().min(0, '水道代は0以上を指定してください'),
  })).min(1, '少なくとも1件のデータが必要です'),
})

/** GET /api/facilities/utilities -- 水光熱費一覧（月別・物件別） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const dormitoryId = searchParams.get('dormitoryId')

    const where: Record<string, unknown> = {}
    if (month) where.month = month
    if (dormitoryId) where.dormitoryId = dormitoryId

    const utilities = await prisma.dormitoryUtility.findMany({
      where,
      include: {
        dormitory: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ month: 'desc' }, { dormitory: { name: 'asc' } }],
    })

    const result = utilities.map((u) => ({
      ...u,
      electricity: Number(u.electricity),
      gas: Number(u.gas),
      water: Number(u.water),
    }))

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/facilities/utilities -- 月次水光熱費の一括入力（upsert） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, batchUtilitySchema)

    // 全物件分を一括で upsert（既存データがあれば更新）
    const results = await Promise.all(
      body.entries.map((entry) =>
        prisma.dormitoryUtility.upsert({
          where: {
            dormitoryId_month: {
              dormitoryId: entry.dormitoryId,
              month: body.month,
            },
          },
          update: {
            electricity: entry.electricity,
            gas: entry.gas,
            water: entry.water,
          },
          create: {
            dormitoryId: entry.dormitoryId,
            month: body.month,
            electricity: entry.electricity,
            gas: entry.gas,
            water: entry.water,
          },
        }),
      ),
    )

    const result = results.map((u) => ({
      ...u,
      electricity: Number(u.electricity),
      gas: Number(u.gas),
      water: Number(u.water),
    }))

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}
