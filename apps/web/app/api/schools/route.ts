import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { corporateType } from '@joshinan/domain'
import { accreditationClass } from '@joshinan/domain'

/** 学校登録のバリデーションスキーマ */
const createSchoolSchema = z.object({
  name: z.string().min(1, '学校名は必須です'),
  schoolCode: z.string().regex(/^\d{3}$/, '学校番号は3桁の半角数字です'),
  address: z.string().min(1, '所在地は必須です'),
  phone: z.string().nullable().optional(),
  corporateName: z.string().min(1, '運営法人名は必須です'),
  corporateType: corporateType.schema,
  accreditationClass: accreditationClass.schema,
  notificationNumber: z.string().nullable().optional(),
  capacity: z.number().int().positive('定員数は正の整数です'),
  establishedDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください'),
})

/** GET /api/schools — 学校一覧取得（実質1件） */
export async function GET() {
  try {
    await requireAuth()

    const schools = await prisma.school.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return ok(schools)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/schools — 学校登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSchoolSchema)

    const school = await prisma.school.create({
      data: {
        ...body,
        establishedDate: new Date(body.establishedDate),
      },
    })

    return ok(school)
  } catch (error) {
    return handleApiError(error)
  }
}
