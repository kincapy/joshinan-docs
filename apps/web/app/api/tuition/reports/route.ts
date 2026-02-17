import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'

/** YYYY-MM 形式のバリデーション */
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

/** GET /api/tuition/reports -- 経理表データ（品目別売上） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month || !MONTH_REGEX.test(month)) {
      return errorResponse('month は YYYY-MM 形式で指定してください', 400)
    }

    // SETTLED の請求を品目情報付きで取得
    const invoices = await prisma.invoice.findMany({
      where: { billingMonth: month, status: 'SETTLED' },
      include: { billingItem: { select: { name: true, displayOrder: true } } },
    })

    // 品目別に集計
    const salesMap = new Map<
      string,
      { itemName: string; displayOrder: number; amount: number; count: number }
    >()

    for (const inv of invoices) {
      const name = inv.billingItem.name
      const current = salesMap.get(name) ?? {
        itemName: name,
        displayOrder: inv.billingItem.displayOrder,
        amount: 0,
        count: 0,
      }
      current.amount += Number(inv.amount)
      current.count += 1
      salesMap.set(name, current)
    }

    // 表示順でソート
    const salesByItem = Array.from(salesMap.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder,
    )

    // 合計売上
    const totalSales = salesByItem.reduce((sum, item) => sum + item.amount, 0)

    return ok({ month, salesByItem, totalSales })
  } catch (error) {
    return handleApiError(error)
  }
}
