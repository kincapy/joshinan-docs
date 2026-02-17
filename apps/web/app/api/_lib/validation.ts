import { NextRequest } from 'next/server'
import { z } from 'zod'

/** リクエストボディを Zod スキーマでバリデーション */
export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const body = await request.json()
  return schema.parse(body)
}

/** クエリパラメータを Zod スキーマでバリデーション */
export function parseQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): T {
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())
  return schema.parse(params)
}
