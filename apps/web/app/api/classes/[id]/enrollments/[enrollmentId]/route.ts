import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string; enrollmentId: string }> }

/** 在籍終了のバリデーションスキーマ */
const updateEnrollmentSchema = z.object({
  endDate: z.string().min(1, '在籍終了日は必須です'),
})

/** PUT /api/classes/:id/enrollments/:enrollmentId — 在籍終了（除籍） */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { enrollmentId } = await params
    const body = await parseBody(request, updateEnrollmentSchema)

    const updated = await prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: { endDate: new Date(body.endDate) },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
