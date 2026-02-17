import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { timeSlot, jlptLevel, cefrLevel } from '@joshinan/domain'

type RouteParams = { params: Promise<{ id: string }> }

/** クラス更新のバリデーションスキーマ */
const updateClassSchema = z
  .object({
    name: z.string().min(1).optional(),
    printName: z.string().nullable().optional(),
    jlptLevel: jlptLevel.schema.nullable().optional(),
    cefrLevel: cefrLevel.schema.nullable().optional(),
    timeSlot: timeSlot.schema.optional(),
    isSubClass: z.boolean().optional(),
    maxStudents: z.number().int().min(1).optional(),
    fiscalYear: z.number().int().min(2000).max(2100).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })

/** GET /api/classes/:id — クラス詳細（在籍学生含む） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const classData = await prisma.class.findUniqueOrThrow({
      where: { id },
      include: {
        // 在籍中の学生（endDate が null）を取得
        classEnrollments: {
          where: { endDate: null },
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                nameEn: true,
                nameKanji: true,
              },
            },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    })

    return ok(classData)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/classes/:id — クラス更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateClassSchema)

    // maxStudents の変更は、現在の在籍人数を下回る値への変更を不可とする
    if (body.maxStudents !== undefined) {
      const currentCount = await prisma.classEnrollment.count({
        where: { classId: id, endDate: null },
      })
      if (body.maxStudents < currentCount) {
        return errorResponse(
          `最大人数は現在の在籍人数（${currentCount}名）以上に設定してください`,
          400,
        )
      }
    }

    // startDate / endDate の整合性チェック
    if (body.startDate || body.endDate) {
      const existing = await prisma.class.findUniqueOrThrow({ where: { id } })
      const newStart = body.startDate ? new Date(body.startDate) : existing.startDate
      const newEnd = body.endDate ? new Date(body.endDate) : existing.endDate
      if (newStart >= newEnd) {
        return errorResponse('終了日は開始日より後にしてください', 400)
      }
    }

    const data: Record<string, unknown> = { ...body }
    // 日付文字列を Date に変換
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate) data.endDate = new Date(body.endDate)

    const updated = await prisma.class.update({
      where: { id },
      data,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
