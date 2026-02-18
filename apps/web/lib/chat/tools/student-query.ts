import { prisma } from '@/lib/prisma'

/** Prisma の StudentStatus enum 値 */
const VALID_STATUSES = [
  'PRE_ENROLLMENT',
  'ENROLLED',
  'ON_LEAVE',
  'WITHDRAWN',
  'EXPELLED',
  'GRADUATED',
  'COMPLETED',
] as const

/** 日本語ステータス → enum 値の変換マップ（AI が日本語で返した場合のフォールバック） */
const STATUS_JP_MAP: Record<string, string> = {
  入学前: 'PRE_ENROLLMENT',
  在学: 'ENROLLED',
  在学中: 'ENROLLED',
  休学: 'ON_LEAVE',
  退学: 'WITHDRAWN',
  除籍: 'EXPELLED',
  卒業: 'GRADUATED',
  修了: 'COMPLETED',
}

/**
 * ステータス入力を enum 値に正規化する
 *
 * AI が enum 値を返した場合はそのまま通し、
 * 日本語を返した場合はマップで変換する
 */
function normalizeStatus(raw: string): string | null {
  const upper = raw.toUpperCase()
  if (VALID_STATUSES.includes(upper as (typeof VALID_STATUSES)[number])) {
    return upper
  }
  return STATUS_JP_MAP[raw] ?? null
}

/**
 * 学生検索の Tool Use ハンドラ
 *
 * Claude が「出席率80%以下の学生」等を聞かれた時に呼ばれる
 */
export async function searchStudents(
  input: Record<string, unknown>
): Promise<string> {
  const where: Record<string, unknown> = {}

  // 名前フィルタ（nameEn で部分一致検索）
  if (input.name) {
    where.nameEn = { contains: String(input.name), mode: 'insensitive' }
  }

  // ステータスフィルタ（enum 値に正規化してからクエリに渡す）
  if (input.status) {
    const normalized = normalizeStatus(String(input.status))
    if (normalized) {
      where.status = normalized
    }
  }

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      nameEn: true,
      nameKanji: true,
      nationality: true,
      status: true,
      monthlyAttendanceRates: {
        // 直近の出席率を取得（DB カラム名は month, rate）
        orderBy: { month: 'desc' },
        take: 1,
        select: {
          month: true,
          rate: true,
        },
      },
    },
    orderBy: { nameEn: 'asc' },
    take: 50,
  })

  // 出席率フィルタ（rate は 0.0〜1.0 なのでパーセント換算して比較）
  let filtered = students.map((s) => ({
    id: s.id,
    name: s.nameKanji ?? s.nameEn,
    nationality: s.nationality,
    status: s.status,
    attendanceRate:
      s.monthlyAttendanceRates[0] != null
        ? Math.round(s.monthlyAttendanceRates[0].rate * 100)
        : null,
    yearMonth: s.monthlyAttendanceRates[0]?.month ?? null,
  }))

  if (input.maxAttendanceRate !== undefined) {
    const maxRate = Number(input.maxAttendanceRate)
    filtered = filtered.filter(
      (s) => s.attendanceRate !== null && s.attendanceRate <= maxRate
    )
  }

  return JSON.stringify({
    count: filtered.length,
    students: filtered,
  })
}
