import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@joshinan/database'
import { errorResponse } from './response'

/**
 * API Route のエラーを統一的にハンドリングする
 * Zod バリデーションエラー、Prisma エラーをユーザーにわかりやすいメッセージに変換
 */
export function handleApiError(error: unknown): NextResponse {
  // Zod バリデーションエラー → 400
  if (error instanceof ZodError) {
    return errorResponse(
      error.errors.map((e) => e.message).join(', '),
      400,
    )
  }

  // Prisma ユニーク制約違反 → 409、レコード未検出 → 404
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError
    if (prismaError.code === 'P2002') {
      return errorResponse('既に存在するデータです', 409)
    }
    if (prismaError.code === 'P2025') {
      return errorResponse('データが見つかりません', 404)
    }
  }

  // 認証エラー → 401
  if (error instanceof AuthError) {
    return errorResponse(error.message, 401)
  }

  // その他 → 500
  console.error('Unexpected error:', error)
  return errorResponse('内部エラーが発生しました', 500)
}

/** 認証エラー */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
