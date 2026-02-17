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
const { GET, PATCH } = await import('../../../app/api/projects/[id]/route')

describe('GET /api/projects/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('プロジェクト詳細を取得できる（tasks, members, progress 含む）', async () => {
    const projectData = {
      id: 'proj-1',
      name: 'テストプロジェクト',
      status: 'ACTIVE',
      skill: { id: 'skill-1', name: '特定技能申請' },
      tasks: [
        { taskCode: 'DOC-001', status: 'COMPLETED', required: true, template: { category: 'DOCUMENT_CREATION', actionType: 'FILE_UPLOAD', description: null } },
        { taskCode: 'COL-001', status: 'NOT_STARTED', required: true, template: { category: 'DOCUMENT_COLLECTION', actionType: 'FILE_UPLOAD', description: null } },
        { taskCode: 'COL-002', status: 'NOT_REQUIRED', required: false, template: { category: 'DOCUMENT_COLLECTION', actionType: 'FILE_UPLOAD', description: null } },
      ],
      members: [
        { id: 'member-1', userId: 'test-user-id', role: 'OWNER' },
      ],
    }
    mockPrisma.project.findUniqueOrThrow.mockResolvedValue(projectData)

    const request = createRequest('/api/projects/proj-1')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'proj-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('proj-1')
    expect(json.data.tasks).toHaveLength(3)
    expect(json.data.members).toHaveLength(1)
    // 必須2件中1件完了 → 50%
    expect(json.data.progress).toBe(50)
  })
})

describe('PATCH /api/projects/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('プロジェクトを更新できる', async () => {
    const updatedProject = {
      id: 'proj-1',
      name: '更新後の名前',
      status: 'ACTIVE',
      skill: { id: 'skill-1', name: '特定技能申請' },
    }
    mockPrisma.project.update.mockResolvedValue(updatedProject)

    const request = createRequest('/api/projects/proj-1', {
      method: 'PATCH',
      body: { name: '更新後の名前' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'proj-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('更新後の名前')

    // update に正しい where と data が渡されている
    const updateArgs = mockPrisma.project.update.mock.calls[0][0]
    expect(updateArgs.where.id).toBe('proj-1')
    expect(updateArgs.data.name).toBe('更新後の名前')
  })

  it('COMPLETED に変更すると completedAt が設定される', async () => {
    const updatedProject = {
      id: 'proj-1',
      name: 'テストプロジェクト',
      status: 'COMPLETED',
      completedAt: new Date(),
      skill: { id: 'skill-1', name: '特定技能申請' },
    }
    mockPrisma.project.update.mockResolvedValue(updatedProject)

    const request = createRequest('/api/projects/proj-1', {
      method: 'PATCH',
      body: { status: 'COMPLETED' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'proj-1' }),
    })

    expect(response.status).toBe(200)

    // update の data に completedAt が含まれていることを確認
    const updateArgs = mockPrisma.project.update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('COMPLETED')
    expect(updateArgs.data.completedAt).toBeInstanceOf(Date)
  })
})
