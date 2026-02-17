import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, okList } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'

const PER_PAGE = 30

/** 請求登録スキーマ */
const createInvoiceSchema = z.object({
  caseId: z.string().uuid('案件IDが不正です'),
  companyId: z.string().uuid('企業IDが不正です'),
  invoiceNumber: z.string().min(1, '請求番号は必須です'),
  invoiceType: z.enum(['REFERRAL', 'SUPPORT']),
  amount: z.number().int().positive('金額は正の数を入力してください'),
  issueDate: z.string().min(1, '発行日は必須です'),
  dueDate: z.string().min(1, '支払期日は必須です'),
  notes: z.string().optional(),
})

/**
 * GET /api/ssw/invoices - 請求一覧
 * フィルタ: invoiceType, status, search（企業名）, issueMonth
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const invoiceType = searchParams.get('invoiceType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const issueMonth = searchParams.get('issueMonth') // YYYY-MM 形式
    const page = Math.max(1, Number(searchParams.get('page') || '1'))

    const where: Record<string, unknown> = {}
    if (invoiceType) where.invoiceType = invoiceType
    if (status) where.status = status
    if (search) {
      where.company = { name: { contains: search, mode: 'insensitive' } }
    }
    // 発行月フィルタ（YYYY-MM → その月の1日〜末日）
    if (issueMonth) {
      const [year, month] = issueMonth.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0) // 月末日
      where.issueDate = { gte: startDate, lte: endDate }
    }

    const [invoices, total] = await Promise.all([
      prisma.sswInvoice.findMany({
        where,
        include: {
          sswCase: {
            select: {
              id: true,
              student: {
                select: { id: true, nameEn: true, nameKanji: true, studentNumber: true },
              },
            },
          },
          company: { select: { id: true, name: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.sswInvoice.count({ where }),
    ])

    // 算出プロパティ: 税込金額
    const data = invoices.map((inv) => ({
      ...inv,
      totalWithTax: inv.amount + inv.tax,
    }))

    return okList(data, { page, per: PER_PAGE, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/ssw/invoices - 請求登録
 * 消費税は自動計算（10%）
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createInvoiceSchema)

    // 消費税は外税10%で自動計算
    const tax = Math.floor(body.amount * 0.1)

    const invoice = await prisma.sswInvoice.create({
      data: {
        caseId: body.caseId,
        companyId: body.companyId,
        invoiceNumber: body.invoiceNumber,
        invoiceType: body.invoiceType,
        amount: body.amount,
        tax,
        issueDate: new Date(body.issueDate),
        dueDate: new Date(body.dueDate),
        notes: body.notes,
      },
      include: {
        sswCase: {
          select: {
            id: true,
            student: {
              select: { id: true, nameEn: true, nameKanji: true },
            },
          },
        },
        company: { select: { id: true, name: true } },
      },
    })

    return ok(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}
