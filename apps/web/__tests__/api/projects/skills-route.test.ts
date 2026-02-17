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
const { GET, POST } = await import('../../../app/api/projects/skills/route')

describe('GET /api/projects/skills', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('スキル一覧を取得できる', async () => {
    const skillsData = [
      {
        id: 'skill-1',
        name: '特定技能申請',
        purpose: '在留資格変更',
        goal: '申請書類の提出',
        isActive: true,
        createdAt: new Date(),
      },
    ]
    mockPrisma.skill.findMany.mockResolvedValue(skillsData)
    mockPrisma.skill.count.mockResolvedValue(1)

    const request = createRequest('/api/projects/skills')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe('特定技能申請')
    expect(json.pagination.total).toBe(1)
  })
})

describe('POST /api/projects/skills', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('新規スキルを作成できる', async () => {
    const createdSkill = {
      id: 'new-skill',
      name: 'テストスキル',
      description: null,
      purpose: 'テスト目的',
      goal: 'テスト完了条件',
      workflowDefinition: { steps: [] },
    }
    mockPrisma.skill.create.mockResolvedValue(createdSkill)

    const request = createRequest('/api/projects/skills', {
      method: 'POST',
      body: {
        name: 'テストスキル',
        purpose: 'テスト目的',
        goal: 'テスト完了条件',
        workflowDefinition: { steps: [] },
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('new-skill')
    expect(json.data.name).toBe('テストスキル')

    // create に正しいデータが渡されていることを確認
    const createArgs = mockPrisma.skill.create.mock.calls[0][0]
    expect(createArgs.data.name).toBe('テストスキル')
    expect(createArgs.data.purpose).toBe('テスト目的')
    expect(createArgs.data.goal).toBe('テスト完了条件')
    expect(createArgs.data.workflowDefinition).toEqual({ steps: [] })
  })
})
