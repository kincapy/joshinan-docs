import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrisma, type MockPrisma } from '../../helpers/mock-prisma'
import { createRequest } from '../../helpers/request'

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

const { GET, POST } = await import(
  '../../../app/api/documents/templates/route'
)

describe('GET /api/documents/templates', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('テンプレート一覧を取得できる', async () => {
    const data = [
      {
        id: '1',
        name: '出金依頼書',
        outputFormat: 'EXCEL',
        description: '出金依頼用テンプレート',
        isActive: true,
        _count: { generatedDocuments: 3 },
      },
      {
        id: '2',
        name: '押印申請書',
        outputFormat: 'DOCX',
        description: null,
        isActive: true,
        _count: { generatedDocuments: 0 },
      },
    ]
    mockPrisma.documentTemplate.findMany.mockResolvedValue(data)
    mockPrisma.documentTemplate.count.mockResolvedValue(2)

    const request = createRequest('/api/documents/templates?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.pagination.total).toBe(2)
  })

  it('有効フラグでフィルタされる（デフォルト: 有効のみ）', async () => {
    mockPrisma.documentTemplate.findMany.mockResolvedValue([])
    mockPrisma.documentTemplate.count.mockResolvedValue(0)

    const request = createRequest('/api/documents/templates')
    await GET(request)

    const callArgs = mockPrisma.documentTemplate.findMany.mock.calls[0][0]
    expect(callArgs.where.isActive).toBe(true)
  })
})

describe('POST /api/documents/templates', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('テンプレートを登録できる', async () => {
    const newTemplate = {
      id: 'new-id',
      name: '稟議書',
      outputFormat: 'DOCX',
      description: '稟議用テンプレート',
      isActive: true,
    }
    mockPrisma.documentTemplate.create.mockResolvedValue(newTemplate)

    const request = createRequest('/api/documents/templates', {
      method: 'POST',
      body: {
        name: '稟議書',
        outputFormat: 'DOCX',
        description: '稟議用テンプレート',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('稟議書')
  })

  it('文書名が空だとバリデーションエラー', async () => {
    const request = createRequest('/api/documents/templates', {
      method: 'POST',
      body: {
        name: '',
        outputFormat: 'EXCEL',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正な出力形式だとバリデーションエラー', async () => {
    const request = createRequest('/api/documents/templates', {
      method: 'POST',
      body: {
        name: 'テスト文書',
        outputFormat: 'PDF',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
