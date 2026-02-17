import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/** GET /api/classes — クラス一覧（時間割用） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscalYear')

    const where: Record<string, unknown> = {}
    if (fiscalYear) where.fiscalYear = Number(fiscalYear)

    const classes = await prisma.class.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        timeSlot: true,
        fiscalYear: true,
        jlptLevel: true,
      },
    })

    return ok(classes)
  } catch (error) {
    return handleApiError(error)
  }
}
