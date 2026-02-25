import { prisma } from '@/lib/prisma'
import { writeAuditLogs, type ToolContext, type AuditEntry } from './audit-log'

/** チャットボットから更新可能な Student フィールド */
const UPDATABLE_FIELDS = [
  'phone',
  'email',
  'addressJapan',
  'addressHome',
  'emergencyContactName',
  'emergencyContactPhone',
  'passportNumber',
  'residenceCardNumber',
  'residenceStatus',
  'residenceExpiry',
  'notes',
] as const

type UpdatableField = (typeof UPDATABLE_FIELDS)[number]

/** Date 型で保存するフィールド */
const DATE_FIELDS: ReadonlySet<string> = new Set(['residenceExpiry'])

/**
 * 学生情報更新の Tool Use ハンドラ
 *
 * Claude が「田中さんの住所を変更して」等を指示された時に呼ばれる
 * 変更内容をDBに反映し、AuditLog に変更履歴を記録する
 */
export async function updateStudent(
  input: Record<string, unknown>,
  context?: ToolContext,
): Promise<string> {
  const studentId = String(input.studentId ?? '')
  if (!studentId) {
    return JSON.stringify({ error: '学生IDは必須です' })
  }

  // 現在の学生レコードを取得
  const current = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      nameKanji: true,
      nameEn: true,
      phone: true,
      email: true,
      addressJapan: true,
      addressHome: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      passportNumber: true,
      residenceCardNumber: true,
      residenceStatus: true,
      residenceExpiry: true,
      notes: true,
    },
  })

  if (!current) {
    return JSON.stringify({ error: '学生が見つかりません', studentId })
  }

  // 更新データを構築（変更があるフィールドのみ）
  const updateData: Record<string, unknown> = {}
  const auditEntries: AuditEntry[] = []

  for (const field of UPDATABLE_FIELDS) {
    if (input[field] === undefined) continue

    const newValue = input[field]
    const currentValue = current[field as keyof typeof current]

    // Date フィールドは文字列→Date に変換
    if (DATE_FIELDS.has(field) && typeof newValue === 'string') {
      const dateValue = new Date(newValue)
      if (isNaN(dateValue.getTime())) {
        return JSON.stringify({
          error: `${field} の日付形式が正しくありません: ${newValue}`,
        })
      }
      updateData[field] = dateValue
    } else {
      updateData[field] = newValue === null ? null : String(newValue)
    }

    // 変更前後の値を比較して AuditLog 用のエントリを作成
    const oldVal = currentValue instanceof Date
      ? currentValue.toISOString().split('T')[0]
      : currentValue
    const newVal = DATE_FIELDS.has(field) && typeof newValue === 'string'
      ? newValue
      : newValue

    auditEntries.push({
      action: 'UPDATE',
      tableName: 'students',
      recordId: studentId,
      fieldName: field,
      oldValue: oldVal ?? null,
      newValue: newVal ?? null,
    })
  }

  if (Object.keys(updateData).length === 0) {
    return JSON.stringify({ error: '更新するフィールドが指定されていません' })
  }

  // DB 更新 + AuditLog 書き込み
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: updateData,
    select: {
      id: true,
      nameKanji: true,
      nameEn: true,
      phone: true,
      email: true,
      addressJapan: true,
      addressHome: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      passportNumber: true,
      residenceCardNumber: true,
      residenceStatus: true,
      residenceExpiry: true,
      notes: true,
    },
  })

  // AuditLog を記録（コンテキストがある場合のみ）
  if (context) {
    await writeAuditLogs(context, auditEntries)
  }

  // 変更内容のサマリーを構築
  const changes = auditEntries.map((e) => ({
    field: e.fieldName,
    oldValue: e.oldValue,
    newValue: e.newValue,
  }))

  return JSON.stringify({
    success: true,
    studentName: updated.nameKanji ?? updated.nameEn,
    changes,
  })
}
