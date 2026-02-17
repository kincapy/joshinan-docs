import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrisma, type MockPrisma } from '../../helpers/mock-prisma'
import { createRequest } from '../../helpers/request'

/** Prisma モックのセットアップ */
let mockPrisma: MockPrisma

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@joshinan.ac.jp',
  }),
}))

/** テスト対象をインポート */
const { PUT } = await import('../../../app/api/ssw/support-plans/[id]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PUT /api/ssw/support-plans/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('支援計画のステータスを更新できる', async () => {
    const updatedPlan = {
      id: 'plan-1',
      status: 'COMPLETED',
      endDate: new Date('2025-12-31'),
      sswCase: {
        id: 'case-1',
        company: { id: 'c-1', name: 'テスト株式会社' },
      },
      student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
    }
    mockPrisma.supportPlan.update.mockResolvedValue(updatedPlan)

    const request = createRequest('/api/ssw/support-plans/plan-1', {
      method: 'PUT',
      body: {
        status: 'COMPLETED',
        endDate: '2025-12-31',
      },
    })

    const response = await PUT(request, routeParams('plan-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('COMPLETED')
  })

  it('完了に変更する場合、終了日なしだとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/support-plans/plan-1', {
      method: 'PUT',
      body: {
        status: 'COMPLETED',
      },
    })

    const response = await PUT(request, routeParams('plan-1'))
    expect(response.status).toBe(400)
  })

  it('不正なステータスでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/support-plans/plan-1', {
      method: 'PUT',
      body: {
        status: 'INVALID_STATUS',
      },
    })

    const response = await PUT(request, routeParams('plan-1'))
    expect(response.status).toBe(400)
  })

  it('notes のみ更新できる', async () => {
    const updatedPlan = {
      id: 'plan-1',
      status: 'ACTIVE',
      notes: '更新メモ',
      sswCase: {
        id: 'case-1',
        company: { id: 'c-1', name: 'テスト株式会社' },
      },
      student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
    }
    mockPrisma.supportPlan.update.mockResolvedValue(updatedPlan)

    const request = createRequest('/api/ssw/support-plans/plan-1', {
      method: 'PUT',
      body: {
        notes: '更新メモ',
      },
    })

    const response = await PUT(request, routeParams('plan-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.notes).toBe('更新メモ')
  })
})
