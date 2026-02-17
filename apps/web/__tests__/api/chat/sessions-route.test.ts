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
const { GET, POST } = await import('../../../app/api/chat/sessions/route')

describe('GET /api/chat/sessions', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('セッション一覧を取得できる（userId でフィルタされる）', async () => {
    const sessionsData = [
      {
        id: 'session-1',
        title: 'テストセッション',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        _count: { messages: 5 },
      },
    ]
    mockPrisma.chatSession.findMany.mockResolvedValue(sessionsData)
    mockPrisma.chatSession.count.mockResolvedValue(1)

    const request = createRequest('/api/chat/sessions')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].id).toBe('session-1')
    expect(json.pagination.total).toBe(1)

    // userId でフィルタされていることを確認
    const findManyArgs = mockPrisma.chatSession.findMany.mock.calls[0][0]
    expect(findManyArgs.where.userId).toBe('test-user-id')
  })

  it('ページネーションが機能する', async () => {
    mockPrisma.chatSession.findMany.mockResolvedValue([])
    mockPrisma.chatSession.count.mockResolvedValue(50)

    const request = createRequest('/api/chat/sessions?page=2')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.pagination.page).toBe(2)
    // PER_PAGE=30 で total=50 → totalPages=2
    expect(json.pagination.totalPages).toBe(2)

    // skip が正しく計算されていることを確認（page 2 → skip 30）
    const findManyArgs = mockPrisma.chatSession.findMany.mock.calls[0][0]
    expect(findManyArgs.skip).toBe(30)
    expect(findManyArgs.take).toBe(30)
  })
})

describe('POST /api/chat/sessions', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('新規セッションを作成できる', async () => {
    const newSession = {
      id: 'new-session-id',
      userId: 'test-user-id',
      title: 'ビザ申請について',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }
    mockPrisma.chatSession.create.mockResolvedValue(newSession)

    const request = createRequest('/api/chat/sessions', {
      method: 'POST',
      body: { title: 'ビザ申請について' },
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('new-session-id')
    expect(json.data.title).toBe('ビザ申請について')

    // create に userId が渡されていることを確認
    const createArgs = mockPrisma.chatSession.create.mock.calls[0][0]
    expect(createArgs.data.userId).toBe('test-user-id')
    expect(createArgs.data.title).toBe('ビザ申請について')
  })

  it('タイトル省略でもセッションを作成できる', async () => {
    const newSession = {
      id: 'new-session-id',
      userId: 'test-user-id',
      title: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }
    mockPrisma.chatSession.create.mockResolvedValue(newSession)

    // body を空で送信（title は optional）
    const request = createRequest('/api/chat/sessions', {
      method: 'POST',
      body: {},
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.title).toBeNull()

    // title が null で保存されることを確認
    const createArgs = mockPrisma.chatSession.create.mock.calls[0][0]
    expect(createArgs.data.title).toBeNull()
  })
})
