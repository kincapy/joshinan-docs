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
const { GET } = await import('../../../app/api/chat/approvals/route')

describe('GET /api/chat/approvals', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('ステータスで決裁一覧をフィルタできる', async () => {
    const approvalsData = [
      {
        id: 'approval-1',
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        message: {
          id: 'msg-1',
          content: '有給休暇を申請します',
          session: { id: 'session-1', title: '休暇申請' },
        },
      },
    ]
    mockPrisma.approvalRequest.findMany.mockResolvedValue(approvalsData)
    mockPrisma.approvalRequest.count.mockResolvedValue(1)

    const request = createRequest('/api/chat/approvals?status=PENDING')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].status).toBe('PENDING')

    // status フィルタが where に渡されていることを確認
    const findManyArgs = mockPrisma.approvalRequest.findMany.mock.calls[0][0]
    expect(findManyArgs.where.status).toBe('PENDING')
  })

  it('ステータス未指定で全件取得できる', async () => {
    mockPrisma.approvalRequest.findMany.mockResolvedValue([])
    mockPrisma.approvalRequest.count.mockResolvedValue(0)

    const request = createRequest('/api/chat/approvals')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(0)

    // status フィルタが where に含まれないことを確認
    const findManyArgs = mockPrisma.approvalRequest.findMany.mock.calls[0][0]
    expect(findManyArgs.where.status).toBeUndefined()
  })

  it('ページネーションが機能する', async () => {
    mockPrisma.approvalRequest.findMany.mockResolvedValue([])
    mockPrisma.approvalRequest.count.mockResolvedValue(60)

    const request = createRequest('/api/chat/approvals?page=2')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.pagination.page).toBe(2)
    // PER_PAGE=30 で total=60 → totalPages=2
    expect(json.pagination.totalPages).toBe(2)

    // skip が正しく計算されていることを確認（page 2 → skip 30）
    const findManyArgs = mockPrisma.approvalRequest.findMany.mock.calls[0][0]
    expect(findManyArgs.skip).toBe(30)
    expect(findManyArgs.take).toBe(30)
  })
})
