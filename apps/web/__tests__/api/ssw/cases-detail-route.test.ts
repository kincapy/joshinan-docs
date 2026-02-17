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
const { GET, PUT } = await import('../../../app/api/ssw/cases/[id]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/ssw/cases/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('案件詳細を書類・支援計画・請求付きで取得できる', async () => {
    const caseData = {
      id: 'case-1',
      status: 'PREPARING',
      field: 'NURSING_CARE',
      company: { id: 'c-1', name: 'テスト株式会社' },
      student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', nameKana: 'タロウ', studentNumber: 'S001', nationality: 'ベトナム' },
      documents: [
        { required: true, status: 'COMPLETED', documentCode: 'DOC-001' },
        { required: true, status: 'NOT_STARTED', documentCode: 'DOC-002' },
        { required: true, status: 'COMPLETED', documentCode: 'DOC-003' },
        { required: false, status: 'NOT_REQUIRED', documentCode: 'COL-020' },
      ],
      supportPlan: null,
      sswInvoices: [],
    }
    mockPrisma.sswCase.findUnique.mockResolvedValue(caseData)

    const request = createRequest('/api/ssw/cases/case-1')
    const response = await GET(request, routeParams('case-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('case-1')
    // 必須書類3件中2件完了 = 67%
    expect(json.data.documentProgress).toBe(67)
  })

  it('存在しない案件IDで404エラー', async () => {
    mockPrisma.sswCase.findUnique.mockResolvedValue(null)

    const request = createRequest('/api/ssw/cases/nonexistent')
    const response = await GET(request, routeParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})

describe('PUT /api/ssw/cases/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('案件のステータスを更新できる', async () => {
    const updatedCase = {
      id: 'case-1',
      status: 'APPLIED',
      applicationDate: new Date('2025-06-01'),
    }
    mockPrisma.sswCase.update.mockResolvedValue(updatedCase)

    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: { status: 'APPLIED', applicationDate: '2025-06-01' },
    })

    const response = await PUT(request, routeParams('case-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('APPLIED')
  })

  it('申請中に変更する場合、申請日なしだとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: { status: 'APPLIED' },
    })

    const response = await PUT(request, routeParams('case-1'))
    expect(response.status).toBe(400)
  })

  it('許可済みに変更する場合、許可日なしだとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: { status: 'APPROVED' },
    })

    const response = await PUT(request, routeParams('case-1'))
    expect(response.status).toBe(400)
  })

  it('入社済みに変更する場合、入社日なしだとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: { status: 'EMPLOYED' },
    })

    const response = await PUT(request, routeParams('case-1'))
    expect(response.status).toBe(400)
  })

  it('日付フィールドが Date に変換される', async () => {
    mockPrisma.sswCase.update.mockResolvedValue({ id: 'case-1' })

    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: {
        status: 'APPLIED',
        applicationDate: '2025-06-01',
      },
    })

    await PUT(request, routeParams('case-1'))

    const updateData = mockPrisma.sswCase.update.mock.calls[0][0].data
    expect(updateData.applicationDate).toBeInstanceOf(Date)
  })

  it('不正なステータスでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases/case-1', {
      method: 'PUT',
      body: { status: 'INVALID_STATUS' },
    })

    const response = await PUT(request, routeParams('case-1'))
    expect(response.status).toBe(400)
  })
})
