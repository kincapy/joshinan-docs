import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { dayOfWeek, term } from '@joshinan/domain'

/** 時間割枠の保存スキーマ（upsert用） */
const saveTimetableSlotSchema = z.object({
  classId: z.string().uuid(),
  dayOfWeek: dayOfWeek.schema,
  periodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().nullable().optional(),
  fiscalYear: z.number().int(),
  term: term.schema,
})

/** 時間割枠の削除スキーマ */
const deleteTimetableSlotSchema = z.object({
  id: z.string().uuid(),
})

/**
 * GET /api/timetable-slots — 時間割一覧（クラス×年度×学期で取得）
 * 必須クエリ: classId, fiscalYear, term
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const fiscalYear = searchParams.get('fiscalYear')
    const termValue = searchParams.get('term')

    if (!classId || !fiscalYear || !termValue) {
      return ok([])
    }

    const slots = await prisma.timetableSlot.findMany({
      where: {
        classId,
        fiscalYear: Number(fiscalYear),
        term: termValue as 'FIRST_HALF' | 'SECOND_HALF',
      },
      include: {
        period: true,
        subject: true,
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: { periodNumber: 'asc' } },
      ],
    })

    return ok(slots)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/timetable-slots — 時間割枠の作成または更新（upsert）
 * 同一クラス×曜日×時限×年度×学期が既に存在する場合は更新する
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, saveTimetableSlotSchema)

    // 教員重複チェック（警告用、保存はブロックしない）
    let teacherConflict: string | null = null
    if (body.teacherId) {
      const conflict = await prisma.timetableSlot.findFirst({
        where: {
          teacherId: body.teacherId,
          dayOfWeek: body.dayOfWeek,
          periodId: body.periodId,
          fiscalYear: body.fiscalYear,
          term: body.term,
          classId: { not: body.classId },
        },
        include: {
          class: { select: { name: true } },
          teacher: { select: { name: true } },
        },
      })
      if (conflict) {
        teacherConflict = `${conflict.teacher?.name ?? '教員'} は同じ曜日・時限に ${conflict.class.name} を担当しています`
      }
    }

    // upsert: 複合ユニーク制約で既存データがあれば更新
    const slot = await prisma.timetableSlot.upsert({
      where: {
        classId_dayOfWeek_periodId_fiscalYear_term: {
          classId: body.classId,
          dayOfWeek: body.dayOfWeek,
          periodId: body.periodId,
          fiscalYear: body.fiscalYear,
          term: body.term,
        },
      },
      create: {
        classId: body.classId,
        dayOfWeek: body.dayOfWeek,
        periodId: body.periodId,
        subjectId: body.subjectId,
        teacherId: body.teacherId ?? null,
        fiscalYear: body.fiscalYear,
        term: body.term,
      },
      update: {
        subjectId: body.subjectId,
        teacherId: body.teacherId ?? null,
      },
      include: {
        period: true,
        subject: true,
        teacher: { select: { id: true, name: true } },
      },
    })

    return ok({ slot, teacherConflict })
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE /api/timetable-slots — 時間割枠の削除 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, deleteTimetableSlotSchema)

    await prisma.timetableSlot.delete({ where: { id: body.id } })

    return ok({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
