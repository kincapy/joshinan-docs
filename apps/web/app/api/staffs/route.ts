import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/** GET /api/staffs — 教職員一覧（時間割用） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const staffs = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    return ok(staffs)
  } catch (error) {
    return handleApiError(error)
  }
}
