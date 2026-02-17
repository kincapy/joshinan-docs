import { createClient } from '@/lib/supabase/server'
import { AuthError } from './error'

/**
 * API Route で認証チェックするヘルパー
 * 未認証の場合は AuthError を throw する
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('認証が必要です')
  }

  return user
}
