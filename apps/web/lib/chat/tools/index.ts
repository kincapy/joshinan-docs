import type Anthropic from '@anthropic-ai/sdk'
import { searchStudents } from './student-query'
import { searchAttendance } from './attendance-query'
import { searchTuition } from './tuition-query'

/**
 * Tool Use で Claude に提供する関数の定義
 *
 * 各関数は以下の構造:
 * - definition: Claude API に渡す Tool 定義（名前・説明・パラメータスキーマ）
 * - handler: 実際にサーバーで実行する関数
 */

/** Tool 定義の型 */
export type ToolHandler = (
  input: Record<string, unknown>
) => Promise<string>

/** Tool 定義と実行ハンドラのペア */
export interface ToolEntry {
  definition: Anthropic.Tool
  handler: ToolHandler
}

/** 全 Tool のレジストリ */
export const toolRegistry: Record<string, ToolEntry> = {
  search_students: {
    definition: {
      name: 'search_students',
      description:
        '学生を検索する。名前、クラス、出席率、ステータスなどの条件で絞り込める。',
      input_schema: {
        type: 'object' as const,
        properties: {
          name: {
            type: 'string',
            description: '学生名（部分一致）',
          },
          classId: {
            type: 'string',
            description: 'クラスID',
          },
          status: {
            type: 'string',
            description:
              '在籍ステータス（ENROLLED=在学, PRE_ENROLLMENT=入学前, ON_LEAVE=休学, WITHDRAWN=退学, EXPELLED=除籍, GRADUATED=卒業, COMPLETED=修了）',
            enum: [
              'PRE_ENROLLMENT',
              'ENROLLED',
              'ON_LEAVE',
              'WITHDRAWN',
              'EXPELLED',
              'GRADUATED',
              'COMPLETED',
            ],
          },
          maxAttendanceRate: {
            type: 'number',
            description: '出席率の上限（例: 80 = 80%以下）',
          },
        },
        required: [],
      },
    },
    handler: searchStudents,
  },

  search_attendance: {
    definition: {
      name: 'search_attendance',
      description:
        '出席情報を検索する。学生ID、月、出席率の条件で絞り込める。',
      input_schema: {
        type: 'object' as const,
        properties: {
          studentId: {
            type: 'string',
            description: '学生ID',
          },
          yearMonth: {
            type: 'string',
            description: '対象年月（YYYY-MM形式）',
          },
          maxRate: {
            type: 'number',
            description: '出席率の上限',
          },
        },
        required: [],
      },
    },
    handler: searchAttendance,
  },

  search_tuition: {
    definition: {
      name: 'search_tuition',
      description:
        '学費・未納情報を検索する。未納者一覧や入金状況を確認できる。',
      input_schema: {
        type: 'object' as const,
        properties: {
          unpaidOnly: {
            type: 'boolean',
            description: 'true なら未納者のみ表示',
          },
          studentId: {
            type: 'string',
            description: '学生ID',
          },
          yearMonth: {
            type: 'string',
            description: '対象年月（YYYY-MM形式）',
          },
        },
        required: [],
      },
    },
    handler: searchTuition,
  },
}

/** Claude API に渡す Tool 定義の配列 */
export function getToolDefinitions(): Anthropic.Tool[] {
  return Object.values(toolRegistry).map((entry) => entry.definition)
}

/** Tool 名からハンドラを取得して実行する */
export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  const entry = toolRegistry[toolName]
  if (!entry) {
    return JSON.stringify({ error: `未知のツール: ${toolName}` })
  }
  return entry.handler(input)
}
