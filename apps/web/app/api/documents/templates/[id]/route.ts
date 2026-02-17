import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 出力形式の値一覧（VO ローカル定義） */
const outputFormatValues = ['EXCEL', 'DOCX'] as const

/** テンプレート更新のバリデーションスキーマ */
const updateSchema = z.object({
  name: z.string().min(1, '文書名は必須です').optional(),
  outputFormat: z.enum(outputFormatValues).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/documents/templates/:id — テンプレート詳細 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params

    const template = await prisma.documentTemplate.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { generatedDocuments: true } },
      },
    })

    return ok(template)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/documents/templates/:id — テンプレート更新 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSchema)

    const updated = await prisma.documentTemplate.update({
      where: { id },
      data: body,
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
