import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { qualificationType } from '@joshinan/domain'

/** 資格登録のバリデーションスキーマ */
const createQualificationSchema = z.object({
  qualificationType: qualificationType.schema,
  acquiredDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください').nullable().optional(),
  expirationDate: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください').nullable().optional(),
  notes: z.string().nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/staff/:id/qualifications — 資格一覧 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id: staffId } = await params

    // 教職員の存在チェック
    await prisma.staff.findUniqueOrThrow({ where: { id: staffId } })

    const qualifications = await prisma.teacherQualification.findMany({
      where: { staffId },
      orderBy: { createdAt: 'asc' },
    })

    return okList(qualifications, {
      page: 1,
      per: qualifications.length || 1,
      total: qualifications.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/staff/:id/qualifications — 資格登録 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id: staffId } = await params
    const body = await parseBody(request, createQualificationSchema)

    // 教職員の存在チェック
    await prisma.staff.findUniqueOrThrow({ where: { id: staffId } })

    const qualification = await prisma.teacherQualification.create({
      data: {
        staffId,
        qualificationType: body.qualificationType,
        acquiredDate: body.acquiredDate ? new Date(body.acquiredDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        notes: body.notes ?? null,
      },
    })

    return ok(qualification)
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/staff/:id/qualifications — 資格削除（クエリパラメータで qualificationId を指定） */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id: staffId } = await params

    const { searchParams } = new URL(request.url)
    const qualificationId = searchParams.get('qualificationId')
    if (!qualificationId) {
      return handleApiError(new z.ZodError([{
        code: 'custom',
        path: ['qualificationId'],
        message: '削除対象の資格IDが指定されていません',
      }]))
    }

    // 対象の資格が指定した教職員のものか確認
    await prisma.teacherQualification.findFirstOrThrow({
      where: { id: qualificationId, staffId },
    })

    await prisma.teacherQualification.delete({
      where: { id: qualificationId },
    })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
