import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@joshinan/database'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** スキル一覧取得のクエリパラメータ */
const listQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
})

/** スキル作成のバリデーションスキーマ */
const createSkillSchema = z.object({
  name: z.string().min(1, 'スキル名は必須です'),
  description: z.string().nullable().optional(),
  purpose: z.string().min(1, '目的は必須です'),
  goal: z.string().min(1, '完了条件は必須です'),
  workflowDefinition: z.record(z.unknown()),
})

/** GET /api/projects/skills -- スキル一覧（isActive フィルタ対応） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const params = listQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    )

    const where: Record<string, unknown> = {}
    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true'
    }

    const page = params.page
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.skill.count({ where }),
    ])

    return okList(skills, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/projects/skills -- 新規スキル作成 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSkillSchema)

    const created = await prisma.skill.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        purpose: body.purpose,
        goal: body.goal,
        // Prisma の Json 型に合わせてキャストする
        workflowDefinition: body.workflowDefinition as Prisma.InputJsonValue,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
