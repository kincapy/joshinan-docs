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
  '../../../app/api/documents/generated/route'
)

describe('GET /api/documents/generated', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('生成履歴を取得できる', async () => {
    const data = [
      {
        id: '1',
        templateId: 'tmpl-1',
        createdById: 'staff-1',
        filePath: '/generated/出金依頼書_123.xlsx',
        notes: null,
        createdAt: '2026-01-15T10:00:00.000Z',
        template: { id: 'tmpl-1', name: '出金依頼書', outputFormat: 'EXCEL' },
        createdBy: { id: 'staff-1', name: '山田太郎' },
      },
    ]
    mockPrisma.generatedDocument.findMany.mockResolvedValue(data)
    mockPrisma.generatedDocument.count.mockResolvedValue(1)

    const request = createRequest('/api/documents/generated?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].template.name).toBe('出金依頼書')
  })

  it('templateId でフィルタできる', async () => {
    mockPrisma.generatedDocument.findMany.mockResolvedValue([])
    mockPrisma.generatedDocument.count.mockResolvedValue(0)

    const request = createRequest(
      '/api/documents/generated?templateId=tmpl-1',
    )
    await GET(request)

    const callArgs = mockPrisma.generatedDocument.findMany.mock.calls[0][0]
    expect(callArgs.where.templateId).toBe('tmpl-1')
  })
})

describe('POST /api/documents/generated', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('文書生成レコードを作成できる', async () => {
    /** テンプレート存在確認のモック */
    mockPrisma.documentTemplate.findUniqueOrThrow.mockResolvedValue({
      id: 'tmpl-1',
      name: '出金依頼書',
    })

    const newDoc = {
      id: 'gen-1',
      templateId: 'tmpl-1',
      createdById: 'staff-1',
      filePath: '/generated/出金依頼書_123.xlsx',
      notes: 'テスト生成',
      createdAt: '2026-01-15T10:00:00.000Z',
      template: { id: 'tmpl-1', name: '出金依頼書', outputFormat: 'EXCEL' },
      createdBy: { id: 'staff-1', name: '山田太郎' },
    }
    mockPrisma.generatedDocument.create.mockResolvedValue(newDoc)

    const request = createRequest('/api/documents/generated', {
      method: 'POST',
      body: {
        templateId: 'tmpl-1',
        createdById: 'staff-1',
        filePath: '/generated/出金依頼書_123.xlsx',
        notes: 'テスト生成',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.template.name).toBe('出金依頼書')
  })

  it('テンプレートIDが不正だとバリデーションエラー', async () => {
    const request = createRequest('/api/documents/generated', {
      method: 'POST',
      body: {
        templateId: 'not-a-uuid',
        createdById: 'staff-1',
        filePath: '/generated/test.xlsx',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
