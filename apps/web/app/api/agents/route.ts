import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { agentType } from '@joshinan/domain'

/** エージェント登録のバリデーションスキーマ */
const createAgentSchema = z.object({
  name: z.string().min(1, 'エージェント名は必須です'),
  country: z.string().min(1, '国は必須です'),
  type: agentType.schema,
  feePerStudent: z.number().positive('正の数を入力してください').nullable().optional(),
  contactInfo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  /** 登録時に別名も一緒に登録できる */
  aliases: z.array(z.string().min(1)).optional(),
})

/** GET /api/agents — エージェント一覧（フィルタ・ページネーション・債務残高付き） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const typeFilter = searchParams.get('type')
    const activeFilter = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 30

    // フィルタ条件の構築
    const where: Record<string, unknown> = {}
    if (country) where.country = country
    if (typeFilter) where.type = typeFilter
    if (activeFilter !== null && activeFilter !== '') {
      where.isActive = activeFilter === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { aliases: { some: { aliasName: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true,
          name: true,
          country: true,
          type: true,
          feePerStudent: true,
          isActive: true,
          _count: { select: { students: true } },
          // 債務残高計算のために請求書・支払いを取得
          agentInvoices: {
            select: {
              amount: true,
              payments: { select: { amount: true } },
            },
          },
        },
      }),
      prisma.agent.count({ where }),
    ])

    // 債務残高を算出してレスポンスを整形
    const data = agents.map((agent) => {
      const totalInvoiced = agent.agentInvoices.reduce(
        (sum, inv) => sum + Number(inv.amount), 0,
      )
      const totalPaid = agent.agentInvoices.reduce(
        (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0), 0,
      )
      return {
        id: agent.id,
        name: agent.name,
        country: agent.country,
        type: agent.type,
        feePerStudent: agent.feePerStudent ? Number(agent.feePerStudent) : null,
        isActive: agent.isActive,
        studentCount: agent._count.students,
        outstandingBalance: totalInvoiced - totalPaid,
      }
    })

    return okList(data, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/agents — エージェント登録（別名も同時登録可） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createAgentSchema)

    const agent = await prisma.agent.create({
      data: {
        name: body.name,
        country: body.country,
        type: body.type,
        feePerStudent: body.feePerStudent ?? null,
        contactInfo: body.contactInfo ?? null,
        notes: body.notes ?? null,
        // 別名がある場合は同時に作成
        aliases: body.aliases?.length
          ? { create: body.aliases.map((aliasName) => ({ aliasName })) }
          : undefined,
      },
      include: { aliases: true },
    })

    return ok(agent)
  } catch (error) {
    return handleApiError(error)
  }
}
