import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { corporateType, accreditationClass } from '@joshinan/domain'

/** 学校更新のバリデーションスキーマ */
const updateSchoolSchema = z.object({
  name: z.string().min(1, '学校名は必須です').optional(),
  schoolCode: z.string().regex(/^\d{3}$/, '学校番号は3桁の半角数字です').optional(),
  address: z.string().min(1, '所在地は必須です').optional(),
  phone: z.string().nullable().optional(),
  corporateName: z.string().min(1, '運営法人名は必須です').optional(),
  corporateType: corporateType.schema.optional(),
  accreditationClass: accreditationClass.schema.optional(),
  notificationNumber: z.string().nullable().optional(),
  capacity: z.number().int().positive('定員数は正の整数です').optional(),
  establishedDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください')
    .optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/schools/:id — 学校詳細取得 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const school = await prisma.school.findUniqueOrThrow({
      where: { id },
      include: { enrollmentPeriods: true },
    })

    return ok(school)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/schools/:id — 学校更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSchoolSchema)

    // establishedDate が文字列で来た場合は Date に変換
    const data = body.establishedDate
      ? { ...body, establishedDate: new Date(body.establishedDate) }
      : body

    const school = await prisma.school.update({
      where: { id },
      data,
    })

    return ok(school)
  } catch (error) {
    return handleApiError(error)
  }
}
