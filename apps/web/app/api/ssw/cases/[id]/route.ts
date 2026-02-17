import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

type RouteParams = { params: Promise<{ id: string }> }

/** 案件更新スキーマ */
const updateCaseSchema = z.object({
  status: z
    .enum([
      'PROSPECTING',
      'PREPARING',
      'APPLIED',
      'REVIEWING',
      'APPROVED',
      'EMPLOYED',
      'SUPPORTING',
      'CLOSED',
    ])
    .optional(),
  applicationDate: z.string().optional().nullable(),
  approvalDate: z.string().optional().nullable(),
  entryDate: z.string().optional().nullable(),
  referralFee: z.number().int().positive().optional(),
  monthlySupportFee: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
})

/**
 * GET /api/ssw/cases/:id - 案件詳細
 * 書類・支援計画・請求を含む
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const sswCase = await prisma.sswCase.findUnique({
      where: { id },
      include: {
        company: true,
        student: {
          select: {
            id: true,
            nameEn: true,
            nameKanji: true,
            nameKana: true,
            studentNumber: true,
            nationality: true,
          },
        },
        documents: {
          orderBy: { documentCode: 'asc' },
        },
        supportPlan: true,
        sswInvoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    })

    if (!sswCase) {
      return errorResponse('案件が見つかりません', 404)
    }

    // 書類進捗率を算出
    const requiredDocs = sswCase.documents.filter((d) => d.required)
    const completedDocs = requiredDocs.filter((d) => d.status === 'COMPLETED')
    const documentProgress =
      requiredDocs.length > 0
        ? Math.round((completedDocs.length / requiredDocs.length) * 100)
        : 0

    return ok({ ...sswCase, documentProgress })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/ssw/cases/:id - 案件更新
 * ステータス変更時にビジネスルールを適用
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateCaseSchema)

    // ステータス変更時のビジネスルール
    if (body.status === 'APPLIED' && !body.applicationDate) {
      return errorResponse('申請中に変更する場合は申請日を入力してください', 400)
    }
    if (body.status === 'APPROVED' && !body.approvalDate) {
      return errorResponse('許可済みに変更する場合は許可日を入力してください', 400)
    }
    if (body.status === 'EMPLOYED' && !body.entryDate) {
      return errorResponse('入社済みに変更する場合は入社日を入力してください', 400)
    }

    // 日付フィールドの変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...body }
    for (const dateField of ['applicationDate', 'approvalDate', 'entryDate'] as const) {
      if (body[dateField] !== undefined) {
        data[dateField] = body[dateField] ? new Date(body[dateField] as string) : null
      }
    }

    const updated = await prisma.sswCase.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
        student: {
          select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
        },
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
