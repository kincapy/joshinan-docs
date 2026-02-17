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
const { GET, PATCH } = await import(
  '../../../app/api/chat/approvals/[id]/route'
)

describe('GET /api/chat/approvals/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('決裁詳細を取得できる', async () => {
    const approvalData = {
      id: 'approval-1',
      status: 'PENDING',
      reason: null,
      approverId: null,
      resolvedAt: null,
      createdAt: new Date('2025-01-01'),
      message: {
        id: 'msg-1',
        content: '出張費を申請します',
        role: 'ASSISTANT',
        session: {
          id: 'session-1',
          title: '経費申請',
          userId: 'test-user-id',
        },
      },
    }
    mockPrisma.approvalRequest.findUniqueOrThrow.mockResolvedValue(
      approvalData,
    )

    const request = createRequest('/api/chat/approvals/approval-1')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'approval-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('approval-1')
    expect(json.data.status).toBe('PENDING')
    // メッセージとセッション情報が含まれることを確認
    expect(json.data.message.id).toBe('msg-1')
    expect(json.data.message.session.title).toBe('経費申請')
  })
})

describe('PATCH /api/chat/approvals/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('承認できる（status=APPROVED, resolvedAt が設定される）', async () => {
    // 既存の PENDING 申請
    mockPrisma.approvalRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'approval-1',
      status: 'PENDING',
    })

    const resolvedAt = new Date('2025-01-15T10:00:00')
    mockPrisma.approvalRequest.update.mockResolvedValue({
      id: 'approval-1',
      status: 'APPROVED',
      reason: null,
      approverId: 'test-user-id',
      resolvedAt,
    })

    const request = createRequest('/api/chat/approvals/approval-1', {
      method: 'PATCH',
      body: { status: 'APPROVED' },
    })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'approval-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('APPROVED')
    expect(json.data.approverId).toBe('test-user-id')

    // update に正しいデータが渡されていることを確認
    const updateArgs = mockPrisma.approvalRequest.update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('APPROVED')
    expect(updateArgs.data.approverId).toBe('test-user-id')
    // resolvedAt が Date インスタンスで設定されること
    expect(updateArgs.data.resolvedAt).toBeInstanceOf(Date)
  })

  it('却下できる（status=REJECTED, reason 付き）', async () => {
    mockPrisma.approvalRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'approval-2',
      status: 'PENDING',
    })

    mockPrisma.approvalRequest.update.mockResolvedValue({
      id: 'approval-2',
      status: 'REJECTED',
      reason: '予算超過のため',
      approverId: 'test-user-id',
      resolvedAt: new Date(),
    })

    const request = createRequest('/api/chat/approvals/approval-2', {
      method: 'PATCH',
      body: { status: 'REJECTED', reason: '予算超過のため' },
    })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'approval-2' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('REJECTED')
    expect(json.data.reason).toBe('予算超過のため')

    // update に reason が渡されていることを確認
    const updateArgs = mockPrisma.approvalRequest.update.mock.calls[0][0]
    expect(updateArgs.data.reason).toBe('予算超過のため')
  })

  it('処理済みの申請は再処理できない', async () => {
    // 既に承認済みの申請
    mockPrisma.approvalRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'approval-3',
      status: 'APPROVED',
    })

    const request = createRequest('/api/chat/approvals/approval-3', {
      method: 'PATCH',
      body: { status: 'REJECTED' },
    })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'approval-3' }),
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.message).toBe('この申請は既に処理済みです')
  })
})
