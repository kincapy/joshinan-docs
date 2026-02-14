/**
 * Vercel Edge Middleware によるベーシック認証
 * 環境変数 BASIC_AUTH_USER と BASIC_AUTH_PASSWORD で認証情報を設定する
 *
 * なぜ Edge Middleware か：
 * VitePressの静的サイトでも、Vercelのミドルウェアで
 * 全ページにベーシック認証をかけられる
 */

import { next } from '@vercel/functions'

export const config = {
  // すべてのリクエストに認証をかける
  matcher: '/(.*)',
}

export default function middleware(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    // "Basic base64encoded" 形式からユーザー名とパスワードを取り出す
    const base64Credentials = authHeader.split(' ')[1] || ''
    const credentials = atob(base64Credentials)
    const [user, password] = credentials.split(':')

    const expectedUser = process.env.BASIC_AUTH_USER
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD

    if (user === expectedUser && password === expectedPassword) {
      // 認証成功：リクエストをそのまま通す
      return next()
    }
  }

  // 認証失敗：ブラウザの認証ダイアログを表示
  return new Response('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
