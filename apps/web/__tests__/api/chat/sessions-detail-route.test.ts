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
const { GET, PATCH, DELETE } = await import(
  '../../../app/api/chat/sessions/[id]/route'
)

describe('GET /api/chat/sessions/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('セッション詳細をメッセージ含めて取得できる', async () => {
    const sessionData = {
      id: 'session-1',
      userId: 'test-user-id',
      title: 'テストセッション',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
      messages: [
        {
          id: 'msg-1',
          role: 'USER',
          content: 'こんにちは',
          createdAt: new Date('2025-01-01T10:00:00'),
        },
        {
          id: 'msg-2',
          role: 'ASSISTANT',
          content: 'お手伝いします',
          createdAt: new Date('2025-01-01T10:00:01'),
        },
      ],
    }
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue(sessionData)

    const request = createRequest('/api/chat/sessions/session-1')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'session-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('session-1')
    expect(json.data.messages).toHaveLength(2)
  })

  it('他ユーザーのセッションにはアクセスできない', async () => {
    const otherUserSession = {
      id: 'session-other',
      userId: 'other-user-id', // 別ユーザーのセッション
      title: '他人のセッション',
      messages: [],
    }
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue(
      otherUserSession,
    )

    const request = createRequest('/api/chat/sessions/session-other')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'session-other' }),
    })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.message).toBe(
      'このセッションにアクセスする権限がありません',
    )
  })
})

describe('PATCH /api/chat/sessions/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('タイトルを更新できる', async () => {
    // 所有者チェック用
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue({
      id: 'session-1',
      userId: 'test-user-id',
    })
    // 更新後のデータ
    mockPrisma.chatSession.update.mockResolvedValue({
      id: 'session-1',
      userId: 'test-user-id',
      title: '更新後のタイトル',
    })

    const request = createRequest('/api/chat/sessions/session-1', {
      method: 'PATCH',
      body: { title: '更新後のタイトル' },
    })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'session-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.title).toBe('更新後のタイトル')

    // update に正しいデータが渡されていることを確認
    const updateArgs = mockPrisma.chatSession.update.mock.calls[0][0]
    expect(updateArgs.data.title).toBe('更新後のタイトル')
  })

  it('他ユーザーのセッションは更新できない', async () => {
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue({
      id: 'session-other',
      userId: 'other-user-id',
    })

    const request = createRequest('/api/chat/sessions/session-other', {
      method: 'PATCH',
      body: { title: '更新しようとした' },
    })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'session-other' }),
    })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.message).toBe(
      'このセッションを更新する権限がありません',
    )
  })
})

describe('DELETE /api/chat/sessions/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('セッションを削除できる', async () => {
    // 所有者チェック用
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue({
      id: 'session-1',
      userId: 'test-user-id',
    })
    mockPrisma.chatSession.delete.mockResolvedValue({
      id: 'session-1',
    })

    const request = createRequest('/api/chat/sessions/session-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'session-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.deleted).toBe(true)

    // delete が呼ばれていることを確認
    expect(mockPrisma.chatSession.delete).toHaveBeenCalledWith({
      where: { id: 'session-1' },
    })
  })

  it('他ユーザーのセッションは削除できない', async () => {
    mockPrisma.chatSession.findUniqueOrThrow.mockResolvedValue({
      id: 'session-other',
      userId: 'other-user-id',
    })

    const request = createRequest('/api/chat/sessions/session-other', {
      method: 'DELETE',
    })
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'session-other' }),
    })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.message).toBe(
      'このセッションを削除する権限がありません',
    )
  })
})
