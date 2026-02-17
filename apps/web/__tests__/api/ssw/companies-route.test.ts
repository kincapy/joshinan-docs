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
const { GET, POST } = await import('../../../app/api/ssw/companies/route')

describe('GET /api/ssw/companies', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('企業一覧を取得できる', async () => {
    const companiesData = [
      {
        id: 'c-1',
        name: 'テスト株式会社',
        representative: '山田太郎',
        field: 'NURSING_CARE',
        _count: { sswCases: 3 },
        sswCases: [
          { status: 'PREPARING' },
          { status: 'EMPLOYED' },
          { status: 'CLOSED' },
        ],
      },
      {
        id: 'c-2',
        name: 'サンプル株式会社',
        representative: '鈴木花子',
        field: 'FOOD_SERVICE',
        _count: { sswCases: 0 },
        sswCases: [],
      },
    ]
    mockPrisma.company.findMany.mockResolvedValue(companiesData)
    mockPrisma.company.count.mockResolvedValue(2)

    const request = createRequest('/api/ssw/companies?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].caseCount).toBe(3)
    // CLOSED 以外が有効案件
    expect(json.data[0].activeCaseCount).toBe(2)
    expect(json.pagination.total).toBe(2)
  })

  it('分野でフィルタできる', async () => {
    mockPrisma.company.findMany.mockResolvedValue([])
    mockPrisma.company.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/companies?field=NURSING_CARE')
    await GET(request)

    const callArgs = mockPrisma.company.findMany.mock.calls[0][0]
    expect(callArgs.where.field).toBe('NURSING_CARE')
  })

  it('企業名で検索できる', async () => {
    mockPrisma.company.findMany.mockResolvedValue([])
    mockPrisma.company.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/companies?search=テスト')
    await GET(request)

    const callArgs = mockPrisma.company.findMany.mock.calls[0][0]
    expect(callArgs.where.name.contains).toBe('テスト')
  })
})

describe('POST /api/ssw/companies', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('企業を登録できる', async () => {
    const newCompany = {
      id: 'new-id',
      name: '新規株式会社',
      representative: '田中一郎',
      address: '東京都千代田区1-1',
      phone: '03-1234-5678',
      field: 'NURSING_CARE',
    }
    mockPrisma.company.create.mockResolvedValue(newCompany)

    const request = createRequest('/api/ssw/companies', {
      method: 'POST',
      body: {
        name: '新規株式会社',
        representative: '田中一郎',
        address: '東京都千代田区1-1',
        phone: '03-1234-5678',
        field: 'NURSING_CARE',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('新規株式会社')
  })

  it('企業名なしで登録するとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/companies', {
      method: 'POST',
      body: {
        name: '',
        representative: '田中一郎',
        address: '東京都千代田区1-1',
        phone: '03-1234-5678',
        field: 'NURSING_CARE',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正な分野で登録するとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/companies', {
      method: 'POST',
      body: {
        name: '新規株式会社',
        representative: '田中一郎',
        address: '東京都千代田区1-1',
        phone: '03-1234-5678',
        field: 'INVALID_FIELD',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('法人番号が13桁以外だとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/companies', {
      method: 'POST',
      body: {
        name: '新規株式会社',
        representative: '田中一郎',
        address: '東京都千代田区1-1',
        phone: '03-1234-5678',
        field: 'NURSING_CARE',
        corporateNumber: '12345',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
