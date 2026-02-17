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
const { PATCH } = await import(
  '../../../app/api/projects/[id]/tasks/[taskId]/route'
)

describe('PATCH /api/projects/:id/tasks/:taskId', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('タスクのステータスを更新できる', async () => {
    // プロジェクトの存在確認で使われる
    mockPrisma.project.findUniqueOrThrow.mockResolvedValue({ id: 'proj-1' })

    const updatedTask = {
      id: 'task-1',
      projectId: 'proj-1',
      taskCode: 'DOC-001',
      taskName: '申請書',
      status: 'IN_PROGRESS',
      completedAt: null,
    }
    mockPrisma.projectTask.update.mockResolvedValue(updatedTask)

    const request = createRequest('/api/projects/proj-1/tasks/task-1', {
      method: 'PATCH',
      body: { status: 'IN_PROGRESS' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'proj-1', taskId: 'task-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.status).toBe('IN_PROGRESS')

    // update に正しい where と data が渡されている
    const updateArgs = mockPrisma.projectTask.update.mock.calls[0][0]
    expect(updateArgs.where.id).toBe('task-1')
    expect(updateArgs.data.status).toBe('IN_PROGRESS')
    // COMPLETED 以外なので completedAt は null にクリアされる
    expect(updateArgs.data.completedAt).toBeNull()
  })

  it('COMPLETED に変更すると completedAt が設定される', async () => {
    mockPrisma.project.findUniqueOrThrow.mockResolvedValue({ id: 'proj-1' })

    const updatedTask = {
      id: 'task-1',
      projectId: 'proj-1',
      taskCode: 'DOC-001',
      taskName: '申請書',
      status: 'COMPLETED',
      completedAt: new Date(),
    }
    mockPrisma.projectTask.update.mockResolvedValue(updatedTask)

    const request = createRequest('/api/projects/proj-1/tasks/task-1', {
      method: 'PATCH',
      body: { status: 'COMPLETED' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'proj-1', taskId: 'task-1' }),
    })

    expect(response.status).toBe(200)

    // update の data に completedAt が Date として含まれていることを確認
    const updateArgs = mockPrisma.projectTask.update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('COMPLETED')
    expect(updateArgs.data.completedAt).toBeInstanceOf(Date)
  })
})
