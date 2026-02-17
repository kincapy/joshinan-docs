import { NextRequest } from 'next/server'

/**
 * テスト用の NextRequest を作成するヘルパー
 */
export function createRequest(
  url: string,
  options?: { method?: string; body?: Record<string, unknown> },
): NextRequest {
  const init: RequestInit = {
    method: options?.method ?? 'GET',
  }

  if (options?.body) {
    init.body = JSON.stringify(options.body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}
