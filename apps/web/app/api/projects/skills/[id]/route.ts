import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@joshinan/database'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** スキル更新のバリデーションスキーマ */
const updateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  purpose: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  workflowDefinition: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

/** GET /api/projects/skills/:id -- スキル詳細（taskTemplates と conditionRules を含む） */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const skill = await prisma.skill.findUniqueOrThrow({
      where: { id },
      include: {
        // タスクテンプレートを表示順で取得
        taskTemplates: {
          orderBy: { sortOrder: 'asc' },
        },
        // 条件分岐ルールをタスクコード順で取得
        conditionRules: {
          orderBy: { taskCode: 'asc' },
        },
      },
    })

    return ok(skill)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH /api/projects/skills/:id -- スキル更新 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSkillSchema)

    // Prisma の Json 型に合わせるため、明示的にフィールドを構築する
    const data: Prisma.SkillUpdateInput = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.purpose !== undefined) data.purpose = body.purpose
    if (body.goal !== undefined) data.goal = body.goal
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.workflowDefinition !== undefined) {
      data.workflowDefinition = body.workflowDefinition as Prisma.InputJsonValue
    }

    const updated = await prisma.skill.update({
      where: { id },
      data,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
