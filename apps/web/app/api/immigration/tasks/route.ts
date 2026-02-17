import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 入管タスク種別の値一覧（VO ローカル定義） */
const taskTypeValues = [
  'WITHDRAWAL_REPORT',
  'LOW_ATTENDANCE_REPORT',
  'ENROLLMENT_NOTIFICATION',
  'DEPARTURE_NOTIFICATION',
  'MISSING_PERSON_REPORT',
  'CHANGE_NOTIFICATION',
  'COE_APPLICATION',
  'VISA_RENEWAL',
] as const

/** タスク発生トリガーの値一覧 */
const triggerValues = ['EVENT', 'SCHEDULE'] as const

/** タスクステータスの値一覧 */
const statusValues = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const

/** タスク登録のバリデーションスキーマ */
const createTaskSchema = z.object({
  taskType: z.enum(taskTypeValues),
  trigger: z.enum(triggerValues),
  studentId: z.string().uuid().nullable().optional(),
  deadline: z.string().min(1, '期限は必須です'),
  status: z.enum(statusValues).optional(),
  legalBasis: z.string().nullable().optional(),
  submissionMethod: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  /** タスク作成時に同時登録する書類リスト */
  documents: z
    .array(z.object({ documentName: z.string().min(1) }))
    .optional(),
})

/** GET /api/immigration/tasks — 入管タスク一覧（フィルタ・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const taskType = searchParams.get('taskType')
    const trigger = searchParams.get('trigger')
    const page = Number(searchParams.get('page') || '1')
    const per = 30

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (taskType) where.taskType = taskType
    if (trigger) where.trigger = trigger

    const [tasks, total] = await Promise.all([
      prisma.immigrationTask.findMany({
        where,
        orderBy: { deadline: 'asc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              nameEn: true,
              nameKanji: true,
            },
          },
          _count: { select: { documents: true } },
        },
      }),
      prisma.immigrationTask.count({ where }),
    ])

    return okList(tasks, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/immigration/tasks — 入管タスク登録（書類の同時登録対応） */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createTaskSchema)

    const created = await prisma.immigrationTask.create({
      data: {
        taskType: body.taskType,
        trigger: body.trigger,
        studentId: body.studentId ?? null,
        deadline: new Date(body.deadline),
        status: body.status ?? 'TODO',
        legalBasis: body.legalBasis ?? null,
        submissionMethod: body.submissionMethod ?? null,
        notes: body.notes ?? null,
        /* 書類リストがあれば同時に作成 */
        documents: body.documents
          ? { create: body.documents.map((d) => ({ documentName: d.documentName })) }
          : undefined,
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
