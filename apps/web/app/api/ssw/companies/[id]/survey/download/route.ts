import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { errorResponse } from '@/lib/api/response'
import { generateSurveyWorkbook } from '@/lib/excel/company-survey'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/ssw/companies/:id/survey/download
 * 企業アンケートExcelフォームをダウンロードする
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        officers: { orderBy: { sortOrder: 'asc' } },
        financials: { orderBy: { fiscalYear: 'desc' } },
      },
    })

    if (!company) {
      return errorResponse('企業が見つかりません', 404)
    }

    const workbook = await generateSurveyWorkbook({
      company: {
        id: company.id,
        name: company.name,
        corporateNumber: company.corporateNumber,
        businessDescription: company.businessDescription,
        capitalAmount: company.capitalAmount,
        fullTimeEmployees: company.fullTimeEmployees,
        contactPerson: company.contactPerson,
        contactEmail: company.contactEmail,
        faxNumber: company.faxNumber,
      },
      officers: company.officers.map((o) => ({
        name: o.name,
        nameKana: o.nameKana,
        position: o.position,
      })),
      financials: company.financials.map((f) => ({
        fiscalYear: f.fiscalYear,
        revenue: f.revenue,
        ordinaryIncome: f.ordinaryIncome,
      })),
    })

    const buffer = await workbook.xlsx.writeBuffer()

    // ファイル名にマルチバイト文字を含むため RFC 5987 形式でエンコード
    const fileName = `${company.name}_アンケート.xlsx`
    const encodedName = encodeURIComponent(fileName)

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
