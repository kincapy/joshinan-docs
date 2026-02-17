import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** ビザ更新タスク作成のバリデーションスキーマ */
const createVisaRenewalSchema = z.object({
  studentId: z.string().uuid(),
  deadline: z.string().min(1, '期限は必須です'),
})

/** ビザ更新時の必要書類リスト */
const visaRenewalDocuments = [
  '在留期間更新許可申請書',
  'パスポートコピー',
  '在留カードコピー',
  '出席率証明書',
  '成績証明書',
  '在学証明書',
  '経費支弁に関する書類',
  '納税証明書',
]

/** GET /api/immigration/visa-renewals — ビザ更新が必要な学生一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const monthsFilter = Number(searchParams.get('months') || '3')

    /* 在留期限が指定月数以内の在学中学生を取得 */
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() + monthsFilter)

    const students = await prisma.student.findMany({
      where: {
        status: 'ENROLLED',
        residenceExpiry: {
          lte: cutoffDate,
          /* 既に失効済み（過去）も含める */
        },
      },
      select: {
        id: true,
        studentNumber: true,
        nameEn: true,
        nameKanji: true,
        nationality: true,
        residenceExpiry: true,
      },
      orderBy: { residenceExpiry: 'asc' },
    })

    /* 各学生に対して、既存の VISA_RENEWAL タスクがあるか確認 */
    const studentIds = students.map((s) => s.id)
    const existingTasks = await prisma.immigrationTask.findMany({
      where: {
        studentId: { in: studentIds },
        taskType: 'VISA_RENEWAL',
        status: { not: 'DONE' },
      },
      select: { studentId: true, id: true },
    })
    const taskByStudent = new Map(
      existingTasks.map((t) => [t.studentId, t.id]),
    )

    /* 残り日数と既存タスクID を付加して返す */
    const today = new Date()
    const result = students.map((s) => {
      const expiry = s.residenceExpiry ? new Date(s.residenceExpiry) : null
      const daysUntilExpiry = expiry
        ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null
      return {
        ...s,
        daysUntilExpiry,
        existingTaskId: taskByStudent.get(s.id) ?? null,
      }
    })

    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/immigration/visa-renewals — ビザ更新タスクを作成（必要書類を自動追加） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createVisaRenewalSchema)

    /* 同じ学生の未完了 VISA_RENEWAL タスクが既にあれば重複エラー */
    const existing = await prisma.immigrationTask.findFirst({
      where: {
        studentId: body.studentId,
        taskType: 'VISA_RENEWAL',
        status: { not: 'DONE' },
      },
    })
    if (existing) {
      return ok({ error: 'この学生のビザ更新タスクは既に存在します', taskId: existing.id })
    }

    const created = await prisma.immigrationTask.create({
      data: {
        taskType: 'VISA_RENEWAL',
        trigger: 'SCHEDULE',
        studentId: body.studentId,
        deadline: new Date(body.deadline),
        legalBasis: '入管法第21条',
        submissionMethod: '窓口',
        /* 必要書類を自動追加 */
        documents: {
          create: visaRenewalDocuments.map((name) => ({
            documentName: name,
          })),
        },
      },
      include: {
        student: {
          select: { id: true, studentNumber: true, nameEn: true, nameKanji: true },
        },
        documents: true,
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
