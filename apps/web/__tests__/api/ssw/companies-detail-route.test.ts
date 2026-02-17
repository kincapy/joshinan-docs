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
const { GET, PUT } = await import('../../../app/api/ssw/companies/[id]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/ssw/companies/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('企業詳細を案件・請求付きで取得できる', async () => {
    const companyData = {
      id: 'c-1',
      name: 'テスト株式会社',
      representative: '山田太郎',
      field: 'NURSING_CARE',
      sswCases: [
        { id: 'case-1', status: 'PREPARING', student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' } },
      ],
      sswInvoices: [
        { id: 'inv-1', invoiceNumber: 'INV-001', amount: 150000 },
      ],
    }
    mockPrisma.company.findUnique.mockResolvedValue(companyData)

    const request = createRequest('/api/ssw/companies/c-1')
    const response = await GET(request, routeParams('c-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('テスト株式会社')
    expect(json.data.sswCases).toHaveLength(1)
    expect(json.data.sswInvoices).toHaveLength(1)
  })

  it('存在しない企業IDで404エラー', async () => {
    mockPrisma.company.findUnique.mockResolvedValue(null)

    const request = createRequest('/api/ssw/companies/nonexistent')
    const response = await GET(request, routeParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})

describe('PUT /api/ssw/companies/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('企業情報を更新できる', async () => {
    const updatedCompany = {
      id: 'c-1',
      name: '更新株式会社',
      representative: '山田次郎',
    }
    mockPrisma.company.update.mockResolvedValue(updatedCompany)

    const request = createRequest('/api/ssw/companies/c-1', {
      method: 'PUT',
      body: { name: '更新株式会社', representative: '山田次郎' },
    })

    const response = await PUT(request, routeParams('c-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('更新株式会社')
  })

  it('設立日を更新すると Date 変換される', async () => {
    mockPrisma.company.update.mockResolvedValue({ id: 'c-1' })

    const request = createRequest('/api/ssw/companies/c-1', {
      method: 'PUT',
      body: { establishedDate: '2020-01-15' },
    })

    await PUT(request, routeParams('c-1'))

    const updateData = mockPrisma.company.update.mock.calls[0][0].data
    expect(updateData.establishedDate).toBeInstanceOf(Date)
  })
})
