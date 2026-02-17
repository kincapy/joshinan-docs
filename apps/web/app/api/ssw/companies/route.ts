import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, okList } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** 企業登録スキーマ */
const createCompanySchema = z.object({
  name: z.string().min(1, '企業名は必須です'),
  representative: z.string().min(1, '代表者名は必須です'),
  postalCode: z.string().optional(),
  address: z.string().min(1, '所在地は必須です'),
  phone: z.string().min(1, '電話番号は必須です'),
  field: z.enum([
    'NURSING_CARE',
    'ACCOMMODATION',
    'FOOD_SERVICE',
    'FOOD_MANUFACTURING',
    'AUTO_TRANSPORT',
  ]),
  businessLicense: z.string().optional(),
  corporateNumber: z
    .string()
    .regex(/^\d{13}$/, '法人番号は13桁の数字です')
    .optional()
    .nullable(),
  establishedDate: z.string().optional().nullable(),
  notes: z.string().optional(),
})

/**
 * GET /api/ssw/companies - 企業一覧
 * フィルタ: field, search（企業名）
 * ページネーション: 30件/ページ
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const field = searchParams.get('field')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))

    // フィルタ条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (field) where.field = field
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: { select: { sswCases: true } },
          sswCases: {
            select: { status: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.company.count({ where }),
    ])

    // 算出プロパティ（案件数・有効案件数）を付与
    const data = companies.map((c) => ({
      ...c,
      caseCount: c._count.sswCases,
      activeCaseCount: c.sswCases.filter((sc) => sc.status !== 'CLOSED').length,
      _count: undefined,
      sswCases: undefined,
    }))

    return okList(data, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/ssw/companies - 企業登録
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createCompanySchema)

    const company = await prisma.company.create({
      data: {
        ...body,
        establishedDate: body.establishedDate
          ? new Date(body.establishedDate)
          : null,
      },
    })

    return ok(company)
  } catch (error) {
    return handleApiError(error)
  }
}
