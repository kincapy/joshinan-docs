import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 企業更新スキーマ（全フィールド optional） */
const updateCompanySchema = z.object({
  name: z.string().min(1, '企業名は必須です').optional(),
  representative: z.string().min(1).optional(),
  postalCode: z.string().optional().nullable(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  field: z
    .enum([
      'NURSING_CARE',
      'ACCOMMODATION',
      'FOOD_SERVICE',
      'FOOD_MANUFACTURING',
      'AUTO_TRANSPORT',
    ])
    .optional(),
  businessLicense: z.string().optional().nullable(),
  corporateNumber: z
    .string()
    .regex(/^\d{13}$/, '法人番号は13桁の数字です')
    .optional()
    .nullable(),
  establishedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * GET /api/ssw/companies/:id - 企業詳細
 * 案件一覧と請求履歴を含む
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        sswCases: {
          include: {
            student: { select: { id: true, nameEn: true, nameKanji: true, studentNumber: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
        sswInvoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    })

    if (!company) {
      return errorResponse('企業が見つかりません', 404)
    }

    return ok(company)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/ssw/companies/:id - 企業更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateCompanySchema)

    // 日付フィールドの変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...body }
    if (body.establishedDate !== undefined) {
      data.establishedDate = body.establishedDate
        ? new Date(body.establishedDate)
        : null
    }

    const company = await prisma.company.update({
      where: { id },
      data,
    })

    return ok(company)
  } catch (error) {
    return handleApiError(error)
  }
}
