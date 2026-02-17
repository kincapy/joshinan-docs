import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { subjectCategory, jlptLevel } from '@joshinan/domain'

/** 科目登録のバリデーションスキーマ */
const createSubjectSchema = z.object({
  name: z.string().min(1, '科目名は必須です'),
  category: subjectCategory.schema,
  targetLevel: jlptLevel.schema.nullable().optional(),
  description: z.string().nullable().optional(),
})

/** GET /api/subjects — 科目一覧（フィルタ・検索・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const targetLevel = searchParams.get('targetLevel')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 20

    // フィルタ条件の構築
    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (targetLevel) where.targetLevel = targetLevel
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.subject.count({ where }),
    ])

    return okList(subjects, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/subjects — 科目登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSubjectSchema)

    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        category: body.category,
        targetLevel: body.targetLevel ?? null,
        description: body.description ?? null,
      },
    })

    return ok(subject)
  } catch (error) {
    return handleApiError(error)
  }
}
