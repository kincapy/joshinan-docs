import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { agentType } from '@joshinan/domain'

/** エージェント更新のバリデーションスキーマ */
const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  type: agentType.schema.optional(),
  feePerStudent: z.number().positive().nullable().optional(),
  contactInfo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

/** GET /api/agents/:id — エージェント詳細（リレーション含む） */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    const agent = await prisma.agent.findUniqueOrThrow({
      where: { id },
      include: {
        aliases: { orderBy: { createdAt: 'asc' } },
        students: {
          orderBy: { studentNumber: 'asc' },
          select: {
            id: true,
            studentNumber: true,
            nameKanji: true,
            nameEn: true,
            nationality: true,
            status: true,
          },
        },
        agentInvoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
      },
    })

    return ok(agent)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/agents/:id — エージェント更新 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateAgentSchema)

    const agent = await prisma.agent.update({
      where: { id },
      data: body,
    })

    return ok(agent)
  } catch (error) {
    return handleApiError(error)
  }
}
