import { NextResponse } from 'next/server'

/** 成功レスポンス */
export function ok<T>(data: T) {
  return NextResponse.json({ data, error: null })
}

/** 一覧レスポンス（ページネーション付き） */
export function okList<T>(
  data: T[],
  pagination: { page: number; per: number; total: number },
) {
  return NextResponse.json({
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.per),
    },
    error: null,
  })
}

/** エラーレスポンス */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status })
}
