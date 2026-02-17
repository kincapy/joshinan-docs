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
const { PUT } = await import('../../../app/api/ssw/invoices/[id]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PUT /api/ssw/invoices/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('請求ステータスを更新できる', async () => {
    mockPrisma.sswInvoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'ISSUED' })
    const updatedInvoice = {
      id: 'inv-1',
      status: 'PAID',
      sswCase: {
        id: 'case-1',
        student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎' },
      },
      company: { id: 'c-1', name: 'テスト株式会社' },
    }
    mockPrisma.sswInvoice.update.mockResolvedValue(updatedInvoice)

    const request = createRequest('/api/ssw/invoices/inv-1', {
      method: 'PUT',
      body: { status: 'PAID' },
    })

    const response = await PUT(request, routeParams('inv-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('PAID')
  })

  it('存在しない請求IDで404エラー', async () => {
    mockPrisma.sswInvoice.findUnique.mockResolvedValue(null)

    const request = createRequest('/api/ssw/invoices/nonexistent', {
      method: 'PUT',
      body: { status: 'PAID' },
    })

    const response = await PUT(request, routeParams('nonexistent'))
    expect(response.status).toBe(404)
  })

  it('不正なステータスでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/invoices/inv-1', {
      method: 'PUT',
      body: { status: 'INVALID' },
    })

    const response = await PUT(request, routeParams('inv-1'))
    expect(response.status).toBe(400)
  })
})
