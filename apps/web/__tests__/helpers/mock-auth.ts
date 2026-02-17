import { vi } from 'vitest'

/**
 * 認証モック
 * requireAuth() が常に成功するようにモックする
 */
export function mockAuth() {
  vi.mock('@/lib/api/auth', () => ({
    requireAuth: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@joshinan.ac.jp',
    }),
  }))
}
