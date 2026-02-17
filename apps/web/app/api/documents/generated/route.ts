import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 文書生成のバリデーションスキーマ */
const createSchema = z.object({
  templateId: z.string().uuid('テンプレートIDが不正です'),
  createdById: z.string().uuid('作成者IDが不正です'),
  filePath: z.string().min(1, 'ファイルパスは必須です'),
  notes: z.string().nullable().optional(),
})

/** GET /api/documents/generated — 生成済み文書一覧（ページネーション付き） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 20
    const templateId = searchParams.get('templateId')

    const where: Record<string, unknown> = {}
    if (templateId) where.templateId = templateId

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          template: { select: { id: true, name: true, outputFormat: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.generatedDocument.count({ where }),
    ])

    return okList(documents, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/documents/generated — 文書生成（レコード作成） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSchema)

    /** テンプレートの存在確認 */
    await prisma.documentTemplate.findUniqueOrThrow({
      where: { id: body.templateId },
    })

    const created = await prisma.generatedDocument.create({
      data: {
        templateId: body.templateId,
        createdById: body.createdById,
        filePath: body.filePath,
        notes: body.notes ?? null,
      },
      include: {
        template: { select: { id: true, name: true, outputFormat: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
