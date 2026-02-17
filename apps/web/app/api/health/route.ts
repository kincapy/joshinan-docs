import { NextResponse } from 'next/server'

/** ヘルスチェック（認証不要） */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
