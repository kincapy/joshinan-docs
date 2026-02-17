import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { subjectCategory, jlptLevel } from '@joshinan/domain'

type RouteParams = { params: Promise<{ id: string }> }

/** 科目更新のバリデーションスキーマ */
const updateSubjectSchema = z.object({
  name: z.string().min(1).optional(),
  category: subjectCategory.schema.optional(),
  targetLevel: jlptLevel.schema.nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

/** GET /api/subjects/:id — 科目詳細 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const subject = await prisma.subject.findUniqueOrThrow({
      where: { id },
    })

    return ok(subject)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/subjects/:id — 科目更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSubjectSchema)

    const subject = await prisma.subject.update({
      where: { id },
      data: body,
    })

    return ok(subject)
  } catch (error) {
    return handleApiError(error)
  }
}
