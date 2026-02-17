import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { timeSlot, jlptLevel, cefrLevel } from '@joshinan/domain'

/** クラス登録のバリデーションスキーマ */
const createClassSchema = z
  .object({
    name: z.string().min(1, 'クラス名は必須です'),
    printName: z.string().nullable().optional(),
    jlptLevel: jlptLevel.schema.nullable().optional(),
    cefrLevel: cefrLevel.schema.nullable().optional(),
    timeSlot: timeSlot.schema,
    isSubClass: z.boolean().optional(),
    maxStudents: z.number().int().min(1, '最大人数は1以上です').optional(),
    fiscalYear: z.number().int().min(2000).max(2100),
    startDate: z.string().min(1, '開始日は必須です'),
    endDate: z.string().min(1, '終了日は必須です'),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: '終了日は開始日より後にしてください',
    path: ['endDate'],
  })

/** GET /api/classes — クラス一覧（フィルタ・検索・ページネーション） */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscalYear')
    const filterType = searchParams.get('filter') // active, upcoming, all
    const classType = searchParams.get('classType') // all, regular, subclass
    const search = searchParams.get('search')
    const page = searchParams.get('page')
    const per = 20

    const where: Record<string, unknown> = {}
    if (fiscalYear) where.fiscalYear = Number(fiscalYear)

    // 表示条件フィルタ
    const today = new Date().toISOString().split('T')[0]
    if (filterType === 'active') {
      // 開講中: startDate <= 本日 かつ endDate >= 本日
      where.startDate = { lte: new Date(today) }
      where.endDate = { gte: new Date(today) }
    } else if (filterType === 'upcoming') {
      // 開講予定: startDate > 本日
      where.startDate = { gt: new Date(today) }
    }

    // クラスタイプフィルタ
    if (classType === 'regular') {
      where.isSubClass = false
    } else if (classType === 'subclass') {
      where.isSubClass = true
    }

    // 名前検索
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // ページネーションなしの場合は全件返す（時間割画面用の既存パターンを維持）
    if (!page) {
      const classes = await prisma.class.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { classEnrollments: true } },
        },
      })
      return ok(classes)
    }

    // ページネーションありの場合
    const pageNum = Math.max(1, Number(page))
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * per,
        take: per,
        include: {
          _count: { select: { classEnrollments: true } },
        },
      }),
      prisma.class.count({ where }),
    ])

    return okList(classes, { page: pageNum, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/classes — クラス登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createClassSchema)

    const created = await prisma.class.create({
      data: {
        name: body.name,
        printName: body.printName ?? null,
        jlptLevel: body.jlptLevel ?? null,
        cefrLevel: body.cefrLevel ?? null,
        timeSlot: body.timeSlot,
        isSubClass: body.isSubClass ?? false,
        maxStudents: body.maxStudents ?? 20,
        fiscalYear: body.fiscalYear,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    })

    return ok(created)
  } catch (error) {
    return handleApiError(error)
  }
}
