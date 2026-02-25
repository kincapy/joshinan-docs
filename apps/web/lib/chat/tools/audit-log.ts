import { prisma } from '@/lib/prisma'
import type { AuditAction } from '@prisma/client'

/** ツール実行時に渡すユーザーコンテキスト */
export interface ToolContext {
  /** Supabase Auth UID */
  userId: string
  /** トリガーとなったメッセージID（ストリーミング中は未確定のため省略可） */
  messageId?: string
}

/** AuditLog 1件分の変更情報 */
export interface AuditEntry {
  action: AuditAction
  tableName: string
  recordId: string
  fieldName?: string
  oldValue?: unknown
  newValue?: unknown
}

/**
 * AuditLog にまとめて書き込む
 *
 * トランザクション内で呼ぶことを想定しているが、
 * 単独でも使用可能（内部で createMany を使う）
 */
export async function writeAuditLogs(
  context: ToolContext,
  entries: AuditEntry[],
) {
  if (entries.length === 0) return

  await prisma.auditLog.createMany({
    data: entries.map((entry) => ({
      userId: context.userId,
      messageId: context.messageId ?? null,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId,
      fieldName: entry.fieldName ?? null,
      oldValue: entry.oldValue !== undefined ? entry.oldValue : null,
      newValue: entry.newValue !== undefined ? entry.newValue : null,
    })),
  })
}
