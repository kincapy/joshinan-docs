import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@joshinan/database'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { evaluateConditions } from '@/lib/project/condition-evaluator'
import { calcProgress } from '@/lib/project/calc-progress'

const PER_PAGE = 30

/** プロジェクト一覧取得のクエリパラメータ */
const listQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
})

/** プロジェクト作成のバリデーションスキーマ */
const createProjectSchema = z.object({
  skillId: z.string().uuid('スキルIDが不正です'),
  /** プロジェクト名（省略時は「{学生名}の{スキル名}」を自動生成） */
  name: z.string().optional(),
  contextData: z.record(z.unknown()),
})

/** GET /api/projects -- プロジェクト一覧（status フィルタ、ページネーション、進捗率計算） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const params = listQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    )

    const where: Record<string, unknown> = {}
    if (params.status) {
      where.status = params.status
    }

    const page = params.page
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        include: {
          skill: { select: { id: true, name: true } },
          tasks: { select: { status: true, required: true } },
          _count: { select: { members: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    // 各プロジェクトに進捗率を付与して tasks 配列は除外する
    const result = projects.map(({ tasks, ...project }) => ({
      ...project,
      progress: calcProgress(tasks),
    }))

    return okList(result, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/projects -- 新規プロジェクト作成 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await parseBody(request, createProjectSchema)

    // スキルのタスクテンプレートと条件分岐ルールを取得
    const skill = await prisma.skill.findUniqueOrThrow({
      where: { id: body.skillId },
      include: {
        taskTemplates: { orderBy: { sortOrder: 'asc' } },
        conditionRules: true,
      },
    })

    // studentId が指定されている場合、学生名と国籍を取得する
    const contextData = { ...body.contextData }
    let studentName: string | undefined
    if (contextData.studentId && typeof contextData.studentId === 'string') {
      const student = await prisma.student.findUnique({
        where: { id: contextData.studentId },
        select: { nameKanji: true, nationality: true },
      })
      if (student) {
        studentName = student.nameKanji ?? undefined
        // 国籍が contextData に未設定なら学生DBから自動取得する
        if (!contextData.nationality) {
          contextData.nationality = student.nationality
        }
      }
    }

    // プロジェクト名の自動生成（明示指定がなければ「{学生名}の{スキル名}」）
    const projectName = body.name
      || (studentName ? `${studentName}の${skill.name}` : skill.name)

    // 条件分岐ルールを評価して、各タスクの必須/不要を判定
    const conditionResults = evaluateConditions(
      skill.taskTemplates,
      skill.conditionRules,
      contextData,
    )

    // テンプレートごとの評価結果を taskCode で引けるようにする
    const conditionMap = new Map(
      conditionResults.map((r) => [r.taskCode, r]),
    )

    // プロジェクト + タスク + オーナーメンバーを一括で作成する
    const project = await prisma.project.create({
      data: {
        skillId: body.skillId,
        ownerId: user.id,
        name: projectName,
        // Prisma の Json 型に合わせてキャストする（国籍自動取得済み）
        contextData: contextData as Prisma.InputJsonValue,
        // タスクテンプレートから ProjectTask を自動生成
        tasks: {
          create: skill.taskTemplates.map((template) => {
            const result = conditionMap.get(template.taskCode)
            const isRequired = result?.required ?? template.defaultRequired
            return {
              templateId: template.id,
              taskCode: template.taskCode,
              taskName: template.taskName,
              required: isRequired,
              skipReason: result?.skipReason ?? null,
              // 不要と判定されたタスクは NOT_REQUIRED にする
              status: isRequired ? 'NOT_STARTED' as const : 'NOT_REQUIRED' as const,
            }
          }),
        },
        // 作成者をオーナーとして自動追加
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        skill: { select: { id: true, name: true } },
        tasks: { orderBy: { taskCode: 'asc' } },
        members: true,
      },
    })

    return ok(project)
  } catch (error) {
    return handleApiError(error)
  }
}
