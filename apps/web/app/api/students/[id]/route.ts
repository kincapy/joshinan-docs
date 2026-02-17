import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import {
  gender, studentStatus, preEnrollmentStatus, cohort,
  careerPath, careerResult,
} from '@joshinan/domain'

/** 学生更新のバリデーションスキーマ（全フィールドoptional） */
const updateStudentSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameKanji: z.string().nullable().optional(),
  nameKana: z.string().nullable().optional(),
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), '有効な日付を入力してください').optional(),
  gender: gender.schema.optional(),
  nationality: z.string().min(1).optional(),
  status: studentStatus.schema.optional(),
  preEnrollmentStatus: preEnrollmentStatus.schema.nullable().optional(),
  cohort: cohort.schema.optional(),
  enrollmentDate: z.string().nullable().optional(),
  expectedGraduationDate: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  addressJapan: z.string().nullable().optional(),
  addressHome: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  residenceCardNumber: z.string().nullable().optional(),
  residenceStatus: z.string().nullable().optional(),
  residenceExpiry: z.string().nullable().optional(),
  entryDate: z.string().nullable().optional(),
  entryAirport: z.string().nullable().optional(),
  flightNumber: z.string().nullable().optional(),
  pickupStaffId: z.string().uuid().nullable().optional(),
  workPermitStatus: z.boolean().optional(),
  workPermitDate: z.string().nullable().optional(),
  workPermitExpiry: z.string().nullable().optional(),
  healthInsuranceNumber: z.string().nullable().optional(),
  healthInsuranceDate: z.string().nullable().optional(),
  careerPath: careerPath.schema.nullable().optional(),
  careerDestination: z.string().nullable().optional(),
  careerResult: careerResult.schema.nullable().optional(),
  withdrawalReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/** 日付文字列を Date に変換（null/undefined はそのまま返す） */
function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  return new Date(value)
}

/** GET /api/students/:id — 学生詳細（リレーション含む） */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    const student = await prisma.student.findUniqueOrThrow({
      where: { id },
      include: {
        employments: { orderBy: { createdAt: 'asc' } },
        certifications: { orderBy: { examDate: 'desc' } },
        interviewRecords: {
          orderBy: { interviewDate: 'desc' },
          take: 5,
          include: { staff: { select: { id: true } } },
        },
        agent: { select: { id: true, name: true } },
      },
    })

    return ok(student)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/students/:id — 学生更新（保護フィールドチェック付き） */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateStudentSchema)

    // 保護フィールドのチェック: agentId, withdrawalDate は更新不可
    const existing = await prisma.student.findUniqueOrThrow({ where: { id } })
    if ('agentId' in body) {
      delete (body as Record<string, unknown>).agentId
    }

    // 日付フィールドの変換
    const data: Record<string, unknown> = { ...body }
    const dateFields = [
      'dateOfBirth', 'enrollmentDate', 'expectedGraduationDate',
      'residenceExpiry', 'entryDate', 'workPermitDate', 'workPermitExpiry',
      'healthInsuranceDate',
    ]
    for (const field of dateFields) {
      if (field in data) {
        data[field] = toDate(data[field] as string | null | undefined)
      }
    }

    // 退学への遷移時は退学日を自動設定
    if (
      data.status === 'WITHDRAWN' &&
      existing.status !== 'WITHDRAWN' &&
      !existing.withdrawalDate
    ) {
      data.withdrawalDate = new Date()
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    })

    return ok(student)
  } catch (error) {
    return handleApiError(error)
  }
}
