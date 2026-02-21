import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/error'
import { ok, errorResponse } from '@/lib/api/response'
import { parseSurveyWorkbook } from '@/lib/excel/company-survey-parser'

type RouteParams = { params: Promise<{ id: string }> }

/** Vercel Hobby プランのリクエストボディ上限を考慮（4MB） */
const MAX_FILE_SIZE = 4 * 1024 * 1024

/**
 * POST /api/ssw/companies/:id/survey/upload
 * 記入済みアンケートExcelをアップロードしてデータを反映する
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    // multipart/form-data からファイルを取得
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return errorResponse('ファイルが必要です', 400)
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('ファイルサイズが大きすぎます（4MB以下にしてください）', 400)
    }

    // Excel ファイルかチェック
    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (!isExcel) {
      return errorResponse('Excelファイル（.xlsx）をアップロードしてください', 400)
    }

    // パース
    const buffer = Buffer.from(await file.arrayBuffer())
    let parsed
    try {
      parsed = await parseSurveyWorkbook(buffer)
    } catch (parseError) {
      const message =
        parseError instanceof Error
          ? parseError.message
          : 'ファイルの読み取りに失敗しました'
      return errorResponse(message, 400)
    }

    // URL パスの企業ID と Excel 内の企業ID が一致するか検証
    if (parsed.companyId !== id) {
      return errorResponse(
        'このファイルは別の企業のアンケートです。正しいファイルをアップロードしてください。',
        400,
      )
    }

    // 企業が存在するか確認
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) {
      return errorResponse('企業が見つかりません', 404)
    }

    // トランザクションで一括更新
    await prisma.$transaction(async (tx) => {
      // Company の追加フィールドを更新
      await tx.company.update({
        where: { id },
        data: {
          businessDescription: parsed.businessDescription,
          capitalAmount: parsed.capitalAmount,
          fullTimeEmployees: parsed.fullTimeEmployees,
          contactPerson: parsed.contactPerson,
          contactEmail: parsed.contactEmail,
          faxNumber: parsed.faxNumber,
          surveyRespondedAt: new Date(),
        },
      })

      // 役員情報: 洗い替え（全削除 → 再作成）
      await tx.companyOfficer.deleteMany({ where: { companyId: id } })
      if (parsed.officers.length > 0) {
        await tx.companyOfficer.createMany({
          data: parsed.officers.map((o) => ({
            companyId: id,
            name: o.name,
            nameKana: o.nameKana,
            position: o.position,
            sortOrder: o.sortOrder,
          })),
        })
      }

      // 決算情報: upsert（年度キーで更新）
      for (const f of parsed.financials) {
        await tx.companyFinancial.upsert({
          where: {
            companyId_fiscalYear: { companyId: id, fiscalYear: f.fiscalYear },
          },
          create: {
            companyId: id,
            fiscalYear: f.fiscalYear,
            revenue: f.revenue,
            ordinaryIncome: f.ordinaryIncome,
          },
          update: {
            revenue: f.revenue,
            ordinaryIncome: f.ordinaryIncome,
          },
        })
      }
    })

    return ok({ message: 'アンケートデータを反映しました' })
  } catch (error) {
    return handleApiError(error)
  }
}
