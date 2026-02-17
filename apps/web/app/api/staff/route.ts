import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { staffRole, employmentType, payType } from '@joshinan/domain'

/** 教職員登録のバリデーションスキーマ */
const createStaffSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').nullable().optional(),
  phone: z.string().nullable().optional(),
  role: staffRole.schema,
  employmentType: employmentType.schema,
  hireDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
  payType: payType.schema.nullable().optional(),
  maxWeeklyLessons: z.number().int().min(0).max(25).nullable().optional(),
})

/** GET /api/staff — 教職員一覧（フィルタ・検索・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const employmentTypeFilter = searchParams.get('employmentType')
    const isActiveFilter = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 50

    // フィルタ条件の構築
    const where: Record<string, unknown> = {}
    if (roleFilter) where.role = roleFilter
    if (employmentTypeFilter) where.employmentType = employmentTypeFilter
    if (isActiveFilter !== null) {
      where.isActive = isActiveFilter === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employmentType: true,
          isActive: true,
          maxWeeklyLessons: true,
        },
      }),
      prisma.staff.count({ where }),
    ])

    return okList(staff, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/staff — 教職員登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createStaffSchema)

    const staff = await prisma.staff.create({
      data: {
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        role: body.role,
        employmentType: body.employmentType,
        hireDate: new Date(body.hireDate),
        payType: body.payType ?? null,
        maxWeeklyLessons: body.maxWeeklyLessons ?? null,
      },
    })

    return ok(staff)
  } catch (error) {
    return handleApiError(error)
  }
}
