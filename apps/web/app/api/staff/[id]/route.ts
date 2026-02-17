import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { staffRole, employmentType, payType } from '@joshinan/domain'

/** 教職員更新のバリデーションスキーマ（全フィールドoptional） */
const updateStaffSchema = z.object({
  name: z.string().min(1, '氏名は必須です').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').nullable().optional(),
  phone: z.string().nullable().optional(),
  role: staffRole.schema.optional(),
  employmentType: employmentType.schema.optional(),
  hireDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください').optional(),
  resignationDate: z.string().nullable().optional(),
  payType: payType.schema.nullable().optional(),
  maxWeeklyLessons: z.number().int().min(0).max(25).nullable().optional(),
  isActive: z.boolean().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/staff/:id — 教職員詳細（資格情報を含む） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const staff = await prisma.staff.findUniqueOrThrow({
      where: { id },
      include: {
        qualifications: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return ok(staff)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/staff/:id — 教職員更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateStaffSchema)

    // 日付フィールドの変換
    const data: Record<string, unknown> = { ...body }
    const dateFields = ['hireDate', 'resignationDate']
    for (const field of dateFields) {
      if (field in data) {
        const value = data[field]
        if (value === null) {
          data[field] = null
        } else if (typeof value === 'string') {
          data[field] = new Date(value)
        }
      }
    }

    // 退職日が設定された場合、isActive を自動で false にする
    if (data.resignationDate && data.resignationDate !== null) {
      data.isActive = false
    }

    const staff = await prisma.staff.update({
      where: { id },
      data,
    })

    return ok(staff)
  } catch (error) {
    return handleApiError(error)
  }
}
