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
const { GET, POST } = await import('../../../app/api/ssw/invoices/route')

describe('GET /api/ssw/invoices', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('請求一覧を取得できる', async () => {
    const invoicesData = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2025-001',
        invoiceType: 'REFERRAL',
        amount: 150000,
        tax: 15000,
        status: 'ISSUED',
        sswCase: {
          id: 'case-1',
          student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
        },
        company: { id: 'c-1', name: 'テスト株式会社' },
      },
    ]
    mockPrisma.sswInvoice.findMany.mockResolvedValue(invoicesData)
    mockPrisma.sswInvoice.count.mockResolvedValue(1)

    const request = createRequest('/api/ssw/invoices?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    // 税込金額が算出されている
    expect(json.data[0].totalWithTax).toBe(165000)
    expect(json.pagination.total).toBe(1)
  })

  it('請求種別でフィルタできる', async () => {
    mockPrisma.sswInvoice.findMany.mockResolvedValue([])
    mockPrisma.sswInvoice.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/invoices?invoiceType=REFERRAL')
    await GET(request)

    const callArgs = mockPrisma.sswInvoice.findMany.mock.calls[0][0]
    expect(callArgs.where.invoiceType).toBe('REFERRAL')
  })

  it('ステータスでフィルタできる', async () => {
    mockPrisma.sswInvoice.findMany.mockResolvedValue([])
    mockPrisma.sswInvoice.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/invoices?status=PAID')
    await GET(request)

    const callArgs = mockPrisma.sswInvoice.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('PAID')
  })

  it('企業名で検索できる', async () => {
    mockPrisma.sswInvoice.findMany.mockResolvedValue([])
    mockPrisma.sswInvoice.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/invoices?search=テスト')
    await GET(request)

    const callArgs = mockPrisma.sswInvoice.findMany.mock.calls[0][0]
    expect(callArgs.where.company.name.contains).toBe('テスト')
  })

  it('発行月でフィルタできる', async () => {
    mockPrisma.sswInvoice.findMany.mockResolvedValue([])
    mockPrisma.sswInvoice.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/invoices?issueMonth=2025-06')
    await GET(request)

    const callArgs = mockPrisma.sswInvoice.findMany.mock.calls[0][0]
    expect(callArgs.where.issueDate.gte).toBeInstanceOf(Date)
    expect(callArgs.where.issueDate.lte).toBeInstanceOf(Date)
  })
})

describe('POST /api/ssw/invoices', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('請求を登録でき、消費税が自動計算される', async () => {
    const newInvoice = {
      id: 'new-inv',
      invoiceNumber: 'INV-2025-002',
      invoiceType: 'REFERRAL',
      amount: 150000,
      tax: 15000,
      sswCase: {
        id: 'case-1',
        student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎' },
      },
      company: { id: 'c-1', name: 'テスト株式会社' },
    }
    mockPrisma.sswInvoice.create.mockResolvedValue(newInvoice)

    const request = createRequest('/api/ssw/invoices', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        companyId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceNumber: 'INV-2025-002',
        invoiceType: 'REFERRAL',
        amount: 150000,
        issueDate: '2025-06-01',
        dueDate: '2025-06-30',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.invoiceNumber).toBe('INV-2025-002')

    // 消費税10%が自動計算されている
    const createArgs = mockPrisma.sswInvoice.create.mock.calls[0][0]
    expect(createArgs.data.tax).toBe(15000)
  })

  it('端数切捨てで消費税が計算される', async () => {
    mockPrisma.sswInvoice.create.mockResolvedValue({ id: 'new-inv' })

    const request = createRequest('/api/ssw/invoices', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        companyId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceNumber: 'INV-2025-003',
        invoiceType: 'SUPPORT',
        amount: 10001, // 10001 * 0.1 = 1000.1 → 切捨てで1000
        issueDate: '2025-06-01',
        dueDate: '2025-06-30',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswInvoice.create.mock.calls[0][0]
    expect(createArgs.data.tax).toBe(1000)
  })

  it('請求番号なしでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/invoices', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        companyId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceNumber: '',
        invoiceType: 'REFERRAL',
        amount: 150000,
        issueDate: '2025-06-01',
        dueDate: '2025-06-30',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正な請求種別でバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/invoices', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        companyId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceNumber: 'INV-001',
        invoiceType: 'INVALID',
        amount: 150000,
        issueDate: '2025-06-01',
        dueDate: '2025-06-30',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
