import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 出力形式の値一覧（VO ローカル定義） */
const outputFormatValues = ['EXCEL', 'DOCX'] as const

/** テンプレート登録のバリデーションスキーマ */
const createSchema = z.object({
  name: z.string().min(1, '文書名は必須です'),
  outputFormat: z.enum(outputFormatValues),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

/** GET /api/documents/templates — テンプレート一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 20
    /** 有効なテンプレートのみ表示するフィルタ（デフォルト: 有効のみ） */
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const where: Record<string, unknown> = {}
    if (activeOnly) where.isActive = true

    const [templates, total] = await Promise.all([
      prisma.documentTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          _count: { select: { generatedDocuments: true } },
        },
      }),
      prisma.documentTemplate.count({ where }),
    ])

    return okList(templates, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/documents/templates — テンプレート登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSchema)

    const created = await prisma.documentTemplate.create({
      data: {
        name: body.name,
        outputFormat: body.outputFormat,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
