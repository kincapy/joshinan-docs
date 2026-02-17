import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
/** 出欠ステータスの値 */
const attendanceStatusValues = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EARLY_LEAVE',
  'EXCUSED',
  'SUSPENDED',
] as const

/** 出欠一括登録のスキーマ */
const bulkCreateSchema = z.object({
  classId: z.string().uuid('クラスIDが不正です'),
  date: z.string().min(1, '日付は必須です'),
  records: z.array(
    z.object({
      studentId: z.string().uuid('学生IDが不正です'),
      period: z.number().int().min(1, '時限は1以上です').max(6, '時限は6以下です'),
      status: z.enum(attendanceStatusValues),
    }),
  ).min(1, '出欠記録は1件以上必要です'),
})

/**
 * GET /api/attendance/records — 指定クラス×日付の出欠記録取得
 * query: classId, date (必須)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    if (!classId || !date) {
      return ok([])
    }

    // クラスに在籍中の学生を取得
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        endDate: null,
      },
      select: { studentId: true },
    })
    const studentIds = enrollments.map((e) => e.studentId)

    // 出欠記録を取得
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        date: new Date(date),
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            nameKanji: true,
            nameEn: true,
          },
        },
      },
      orderBy: [
        { student: { studentNumber: 'asc' } },
        { period: 'asc' },
      ],
    })

    return ok(records)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/attendance/records — 出欠一括登録（upsert）
 * 同じ学生×日付×時限の既存レコードは上書き
 * 副作用: 対象学生の月次出席率を再計算
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, bulkCreateSchema)

    const dateObj = new Date(body.date)

    // 日付が未来でないことを確認
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (dateObj > today) {
      return ok({ error: '未来の日付には登録できません' })
    }

    // 一括 upsert（同じ学生×日付×時限は上書き）
    const results = await prisma.$transaction(
      body.records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            studentId_date_period: {
              studentId: record.studentId,
              date: dateObj,
              period: record.period,
            },
          },
          create: {
            studentId: record.studentId,
            date: dateObj,
            period: record.period,
            status: record.status,
          },
          update: {
            status: record.status,
          },
        }),
      ),
    )

    // 副作用: 対象学生の月次出席率を再計算
    const uniqueStudentIds = [...new Set(body.records.map((r) => r.studentId))]
    const month = body.date.substring(0, 7) // YYYY-MM
    await recalculateMonthlyRates(uniqueStudentIds, month)

    return ok({ count: results.length })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 月次出席率を再計算する
 * 遅刻4回 = 欠席1回、SUSPENDED は計算対象外
 */
async function recalculateMonthlyRates(studentIds: string[], month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0) // 月末

  for (const studentId of studentIds) {
    // 対象月の全レコードを集計
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
      },
    })

    // SUSPENDED を除外した全レコード数 = 出席すべき時間数
    const nonSuspended = records.filter((r) => r.status !== 'SUSPENDED')
    const requiredHours = nonSuspended.length

    if (requiredHours === 0) {
      // レコードがない場合は月次出席率を削除
      await prisma.monthlyAttendanceRate.deleteMany({
        where: { studentId, month },
      })
      continue
    }

    // PRESENT + EXCUSED = 出席した時間数
    const attendedHours = nonSuspended.filter(
      (r) => r.status === 'PRESENT' || r.status === 'EXCUSED',
    ).length

    // 遅刻回数と遅刻換算欠席数
    const lateCount = nonSuspended.filter((r) => r.status === 'LATE').length
    const lateAsAbsence = Math.floor(lateCount / 4)

    // 出席率 = (出席時間 - 遅刻換算欠席) / 出席すべき時間
    const rate = Math.max(0, (attendedHours - lateAsAbsence) / requiredHours)

    // アラートレベル判定
    let alertLevel: 'NORMAL' | 'GUIDANCE_REQUIRED' | 'REPORT_REQUIRED'
    if (rate >= 0.8) {
      alertLevel = 'NORMAL'
    } else if (rate >= 0.5) {
      alertLevel = 'GUIDANCE_REQUIRED'
    } else {
      alertLevel = 'REPORT_REQUIRED'
    }

    // upsert で月次出席率を更新
    await prisma.monthlyAttendanceRate.upsert({
      where: { studentId_month: { studentId, month } },
      create: {
        studentId,
        month,
        requiredHours,
        attendedHours,
        lateCount,
        lateAsAbsence,
        rate,
        alertLevel,
      },
      update: {
        requiredHours,
        attendedHours,
        lateCount,
        lateAsAbsence,
        rate,
        alertLevel,
      },
    })
  }
}
