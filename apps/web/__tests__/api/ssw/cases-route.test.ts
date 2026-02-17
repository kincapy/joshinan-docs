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
const { GET, POST } = await import('../../../app/api/ssw/cases/route')

describe('GET /api/ssw/cases', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('案件一覧を取得できる', async () => {
    const casesData = [
      {
        id: 'case-1',
        status: 'PREPARING',
        field: 'NURSING_CARE',
        company: { id: 'c-1', name: 'テスト株式会社' },
        student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001', nationality: 'ベトナム' },
        documents: [
          { required: true, status: 'COMPLETED' },
          { required: true, status: 'NOT_STARTED' },
          { required: false, status: 'NOT_REQUIRED' },
        ],
      },
    ]
    mockPrisma.sswCase.findMany.mockResolvedValue(casesData)
    mockPrisma.sswCase.count.mockResolvedValue(1)

    const request = createRequest('/api/ssw/cases?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    // 必須書類2件中1件完了 = 50%
    expect(json.data[0].documentProgress).toBe(50)
    expect(json.pagination.total).toBe(1)
  })

  it('ステータスでフィルタできる', async () => {
    mockPrisma.sswCase.findMany.mockResolvedValue([])
    mockPrisma.sswCase.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/cases?status=APPLIED')
    await GET(request)

    const callArgs = mockPrisma.sswCase.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('APPLIED')
  })

  it('分野でフィルタできる', async () => {
    mockPrisma.sswCase.findMany.mockResolvedValue([])
    mockPrisma.sswCase.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/cases?field=FOOD_SERVICE')
    await GET(request)

    const callArgs = mockPrisma.sswCase.findMany.mock.calls[0][0]
    expect(callArgs.where.field).toBe('FOOD_SERVICE')
  })

  it('企業名で検索できる', async () => {
    mockPrisma.sswCase.findMany.mockResolvedValue([])
    mockPrisma.sswCase.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/cases?search=テスト')
    await GET(request)

    const callArgs = mockPrisma.sswCase.findMany.mock.calls[0][0]
    expect(callArgs.where.company.name.contains).toBe('テスト')
  })
})

describe('POST /api/ssw/cases', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('案件を登録すると書類が自動生成される', async () => {
    // 学生の国籍を返す
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: 'ベトナム' })

    const newCase = {
      id: 'new-case',
      companyId: 'c-1',
      studentId: 's-1',
      field: 'NURSING_CARE',
      referralFee: 150000,
      monthlySupportFee: 10000,
      company: { id: 'c-1', name: 'テスト株式会社' },
      student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
      documents: [],
    }
    mockPrisma.sswCase.create.mockResolvedValue(newCase)

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'NURSING_CARE',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('new-case')

    // create に documents.create が渡されていることを確認
    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    expect(createArgs.data.documents.create).toBeDefined()
    expect(createArgs.data.documents.create.length).toBeGreaterThan(0)
  })

  it('介護分野の場合、介護日本語評価試験書類が必須になる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: '中国' })
    mockPrisma.sswCase.create.mockResolvedValue({ id: 'new-case', documents: [] })

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'NURSING_CARE',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    const docs = createArgs.data.documents.create
    const col020 = docs.find((d: { documentCode: string }) => d.documentCode === 'COL-020')
    // 介護分野 → COL-020（介護日本語評価試験）は必須
    expect(col020.required).toBe(true)
    expect(col020.status).toBe('NOT_STARTED')
  })

  it('宿泊分野以外の場合、旅館業許可証は不要になる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: '中国' })
    mockPrisma.sswCase.create.mockResolvedValue({ id: 'new-case', documents: [] })

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'NURSING_CARE',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    const docs = createArgs.data.documents.create
    const col021 = docs.find((d: { documentCode: string }) => d.documentCode === 'COL-021')
    // 宿泊分野以外 → COL-021（旅館業許可証）は不要
    expect(col021.required).toBe(false)
    expect(col021.status).toBe('NOT_REQUIRED')
  })

  it('二国間取決対象国の場合、関連書類が必須になる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: 'ベトナム' })
    mockPrisma.sswCase.create.mockResolvedValue({ id: 'new-case', documents: [] })

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'FOOD_SERVICE',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    const docs = createArgs.data.documents.create
    const col019 = docs.find((d: { documentCode: string }) => d.documentCode === 'COL-019')
    // ベトナムは二国間取決対象国 → COL-019 は必須
    expect(col019.required).toBe(true)
  })

  it('非対象国の場合、二国間取決書類は不要になる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: '中国' })
    mockPrisma.sswCase.create.mockResolvedValue({ id: 'new-case', documents: [] })

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'FOOD_SERVICE',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    const docs = createArgs.data.documents.create
    const col019 = docs.find((d: { documentCode: string }) => d.documentCode === 'COL-019')
    // 中国は二国間取決対象国ではない → COL-019 は不要
    expect(col019.required).toBe(false)
  })

  it('デフォルトの紹介料・支援費が設定される', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ nationality: '中国' })
    mockPrisma.sswCase.create.mockResolvedValue({ id: 'new-case', documents: [] })

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'FOOD_SERVICE',
      },
    })

    await POST(request)

    const createArgs = mockPrisma.sswCase.create.mock.calls[0][0]
    // デフォルト: 紹介料15万円、支援費1万円/月
    expect(createArgs.data.referralFee).toBe(150000)
    expect(createArgs.data.monthlySupportFee).toBe(10000)
  })

  it('存在しない学生IDだとエラー', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null)

    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        field: 'NURSING_CARE',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.message).toBe('学生が見つかりません')
  })

  it('不正なUUIDでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases', {
      method: 'POST',
      body: {
        companyId: 'invalid-uuid',
        studentId: 'invalid-uuid',
        field: 'NURSING_CARE',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
