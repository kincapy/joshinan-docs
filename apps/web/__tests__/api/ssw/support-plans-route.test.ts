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
const { GET, POST, PUT } = await import('../../../app/api/ssw/support-plans/route')

describe('GET /api/ssw/support-plans', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('支援計画一覧を取得できる', async () => {
    const plansData = [
      {
        id: 'plan-1',
        status: 'ACTIVE',
        startDate: new Date('2025-04-01'),
        sswCase: {
          id: 'case-1',
          company: { id: 'c-1', name: 'テスト株式会社' },
        },
        student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
      },
    ]
    mockPrisma.supportPlan.findMany.mockResolvedValue(plansData)
    mockPrisma.supportPlan.count.mockResolvedValue(1)

    const request = createRequest('/api/ssw/support-plans?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.pagination.total).toBe(1)
  })

  it('ステータスでフィルタできる', async () => {
    mockPrisma.supportPlan.findMany.mockResolvedValue([])
    mockPrisma.supportPlan.count.mockResolvedValue(0)

    const request = createRequest('/api/ssw/support-plans?status=ACTIVE')
    await GET(request)

    const callArgs = mockPrisma.supportPlan.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('ACTIVE')
  })
})

describe('POST /api/ssw/support-plans', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('支援計画を登録できる', async () => {
    // 既存の ACTIVE な計画がない
    mockPrisma.supportPlan.findFirst.mockResolvedValue(null)

    const newPlan = {
      id: 'new-plan',
      caseId: 'case-1',
      studentId: 's-1',
      status: 'ACTIVE',
      sswCase: {
        id: 'case-1',
        company: { id: 'c-1', name: 'テスト株式会社' },
      },
      student: { id: 's-1', nameEn: 'Taro', nameKanji: '太郎', studentNumber: 'S001' },
    }
    mockPrisma.supportPlan.create.mockResolvedValue(newPlan)

    const request = createRequest('/api/ssw/support-plans', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2025-04-01',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('new-plan')
  })

  it('同一学生に ACTIVE な計画がある場合は409エラー', async () => {
    // 既に ACTIVE な計画がある
    mockPrisma.supportPlan.findFirst.mockResolvedValue({ id: 'existing-plan', status: 'ACTIVE' })

    const request = createRequest('/api/ssw/support-plans', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2025-04-01',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it('開始日なしでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/support-plans', {
      method: 'POST',
      body: {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/ssw/support-plans', () => {
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

    const request = createRequest('/api/ssw/support-plans', {
      method: 'PUT',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        endDate: '2025-12-31',
      },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('COMPLETED')
  })

  it('完了に変更する場合、終了日なしだとバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/support-plans', {
      method: 'PUT',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
      },
    })

    const response = await PUT(request)
    expect(response.status).toBe(400)
  })

  it('不正なステータスでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/support-plans', {
      method: 'PUT',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'INVALID_STATUS',
      },
    })

    const response = await PUT(request)
    expect(response.status).toBe(400)
  })
})
