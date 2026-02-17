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
const { PUT } = await import('../../../app/api/ssw/cases/[id]/documents/[docId]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string, docId: string) {
  return { params: Promise.resolve({ id, docId }) }
}

describe('PUT /api/ssw/cases/:id/documents/:docId', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('書類ステータスを更新できる', async () => {
    mockPrisma.caseDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      caseId: 'case-1',
      documentCode: 'DOC-001',
      status: 'NOT_STARTED',
    })
    const updatedDoc = {
      id: 'doc-1',
      documentCode: 'DOC-001',
      status: 'COMPLETED',
    }
    mockPrisma.caseDocument.update.mockResolvedValue(updatedDoc)

    const request = createRequest('/api/ssw/cases/case-1/documents/doc-1', {
      method: 'PUT',
      body: { status: 'COMPLETED' },
    })

    const response = await PUT(request, routeParams('case-1', 'doc-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('COMPLETED')
  })

  it('存在しない書類IDで404エラー', async () => {
    mockPrisma.caseDocument.findFirst.mockResolvedValue(null)

    const request = createRequest('/api/ssw/cases/case-1/documents/nonexistent', {
      method: 'PUT',
      body: { status: 'COMPLETED' },
    })

    const response = await PUT(request, routeParams('case-1', 'nonexistent'))
    expect(response.status).toBe(404)
  })

  it('不正なステータスでバリデーションエラー', async () => {
    const request = createRequest('/api/ssw/cases/case-1/documents/doc-1', {
      method: 'PUT',
      body: { status: 'INVALID_STATUS' },
    })

    const response = await PUT(request, routeParams('case-1', 'doc-1'))
    expect(response.status).toBe(400)
  })

  it('備考とスキップ理由を更新できる', async () => {
    mockPrisma.caseDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      caseId: 'case-1',
    })
    mockPrisma.caseDocument.update.mockResolvedValue({
      id: 'doc-1',
      notes: '修正依頼済み',
      skipReason: null,
    })

    const request = createRequest('/api/ssw/cases/case-1/documents/doc-1', {
      method: 'PUT',
      body: { notes: '修正依頼済み' },
    })

    const response = await PUT(request, routeParams('case-1', 'doc-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.notes).toBe('修正依頼済み')
  })
})
