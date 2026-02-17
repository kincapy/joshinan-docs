import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { enrollmentType } from '@joshinan/domain'

type RouteParams = { params: Promise<{ id: string }> }

/** 学生割当のバリデーションスキーマ（複数学生同時割当対応） */
const assignStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, '学生を選択してください'),
  enrollmentType: enrollmentType.schema,
  startDate: z.string().min(1, '在籍開始日は必須です'),
})

/** GET /api/classes/:id/enrollments — クラスの在籍一覧 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: id },
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
    })

    return ok(enrollments)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/classes/:id/enrollments — 学生をクラスに割り当て */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id: classId } = await params
    const body = await parseBody(request, assignStudentsSchema)

    // クラスの存在確認と最大人数チェック
    const classData = await prisma.class.findUniqueOrThrow({
      where: { id: classId },
    })
    const currentCount = await prisma.classEnrollment.count({
      where: { classId, endDate: null },
    })
    const remaining = classData.maxStudents - currentCount
    if (body.studentIds.length > remaining) {
      return errorResponse(
        `最大人数を超えます（残り${remaining}名まで割当可能）`,
        400,
      )
    }

    // REGULAR の場合、各学生が他のクラスに REGULAR で在籍中でないか確認
    if (body.enrollmentType === 'REGULAR') {
      const existing = await prisma.classEnrollment.findMany({
        where: {
          studentId: { in: body.studentIds },
          enrollmentType: 'REGULAR',
          endDate: null,
        },
        include: {
          student: { select: { nameEn: true } },
          class: { select: { name: true } },
        },
      })
      if (existing.length > 0) {
        const names = existing.map(
          (e) => `${e.student.nameEn}（${e.class.name}）`,
        )
        return errorResponse(
          `以下の学生は既に他のクラスに通常在籍中です: ${names.join(', ')}`,
          400,
        )
      }
    }

    // 一括登録
    const created = await prisma.classEnrollment.createMany({
      data: body.studentIds.map((studentId) => ({
        studentId,
        classId,
        enrollmentType: body.enrollmentType,
        startDate: new Date(body.startDate),
      })),
    })

    return ok({ count: created.count })
  } catch (error) {
    return handleApiError(error)
  }
}
