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
const { GET, POST } = await import('../../../app/api/projects/route')

describe('GET /api/projects', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('プロジェクト一覧を取得でき、進捗率が計算されている', async () => {
    const projectsData = [
      {
        id: 'proj-1',
        name: 'テストプロジェクト',
        status: 'ACTIVE',
        skill: { id: 'skill-1', name: '特定技能申請' },
        // 必須タスク3件中1件完了 = 33%
        tasks: [
          { status: 'COMPLETED', required: true },
          { status: 'NOT_STARTED', required: true },
          { status: 'IN_PROGRESS', required: true },
          { status: 'NOT_REQUIRED', required: false },
        ],
        _count: { members: 2 },
      },
    ]
    mockPrisma.project.findMany.mockResolvedValue(projectsData)
    mockPrisma.project.count.mockResolvedValue(1)

    const request = createRequest('/api/projects')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    // 必須3件中1件完了 → 33%（Math.round(1/3*100)）
    expect(json.data[0].progress).toBe(33)
    // tasks 配列はレスポンスから除外されている
    expect(json.data[0].tasks).toBeUndefined()
    expect(json.pagination.total).toBe(1)
  })

  it('ステータスでフィルタできる', async () => {
    mockPrisma.project.findMany.mockResolvedValue([])
    mockPrisma.project.count.mockResolvedValue(0)

    const request = createRequest('/api/projects?status=COMPLETED')
    await GET(request)

    const callArgs = mockPrisma.project.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('COMPLETED')
  })
})

describe('POST /api/projects', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('新規プロジェクトを作成でき、タスクが自動生成される', async () => {
    // スキルにタスクテンプレートと条件分岐ルールを設定
    const skillWithTemplates = {
      id: 'skill-1',
      name: '特定技能申請',
      taskTemplates: [
        {
          id: 'tmpl-1',
          taskCode: 'DOC-001',
          taskName: '申請書',
          defaultRequired: true,
          sortOrder: 1,
          category: 'DOCUMENT_CREATION',
          actionType: 'FILE_UPLOAD',
        },
        {
          id: 'tmpl-2',
          taskCode: 'COL-001',
          taskName: '在職証明書',
          defaultRequired: true,
          sortOrder: 2,
          category: 'DOCUMENT_COLLECTION',
          actionType: 'FILE_UPLOAD',
        },
        {
          id: 'tmpl-3',
          taskCode: 'COL-002',
          taskName: '介護評価試験',
          defaultRequired: false,
          sortOrder: 3,
          category: 'DOCUMENT_COLLECTION',
          actionType: 'FILE_UPLOAD',
        },
      ],
      conditionRules: [
        {
          id: 'rule-1',
          skillId: 'skill-1',
          taskCode: 'COL-002',
          conditionField: 'sswField',
          operator: 'EQUALS',
          conditionValue: 'NURSING_CARE',
          resultRequired: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }
    mockPrisma.skill.findUniqueOrThrow.mockResolvedValue(skillWithTemplates)

    const createdProject = {
      id: 'proj-new',
      skillId: 'skill-1',
      name: '田中太郎の申請',
      skill: { id: 'skill-1', name: '特定技能申請' },
      tasks: [
        { taskCode: 'DOC-001', status: 'NOT_STARTED', required: true },
        { taskCode: 'COL-001', status: 'NOT_STARTED', required: true },
        { taskCode: 'COL-002', status: 'NOT_REQUIRED', required: false },
      ],
      members: [{ userId: 'test-user-id', role: 'OWNER' }],
    }
    mockPrisma.project.create.mockResolvedValue(createdProject)

    const request = createRequest('/api/projects', {
      method: 'POST',
      body: {
        skillId: '550e8400-e29b-41d4-a716-446655440000',
        name: '田中太郎の申請',
        contextData: { sswField: 'FOOD_SERVICE' },
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.id).toBe('proj-new')

    // create に tasks.create が渡されていることを確認
    const createArgs = mockPrisma.project.create.mock.calls[0][0]
    const tasksCreate = createArgs.data.tasks.create
    expect(tasksCreate).toHaveLength(3)

    // DOC-001: ルールなし → defaultRequired=true → NOT_STARTED
    expect(tasksCreate[0].taskCode).toBe('DOC-001')
    expect(tasksCreate[0].required).toBe(true)
    expect(tasksCreate[0].status).toBe('NOT_STARTED')

    // COL-001: ルールなし → defaultRequired=true → NOT_STARTED
    expect(tasksCreate[1].taskCode).toBe('COL-001')
    expect(tasksCreate[1].required).toBe(true)

    // COL-002: conditionField=sswField, contextData.sswField=FOOD_SERVICE
    //          ルール条件は EQUALS NURSING_CARE → 不一致 → defaultRequired=false
    expect(tasksCreate[2].taskCode).toBe('COL-002')
    expect(tasksCreate[2].required).toBe(false)
    expect(tasksCreate[2].status).toBe('NOT_REQUIRED')

    // オーナーメンバーが自動追加されている
    expect(createArgs.data.members.create.userId).toBe('test-user-id')
    expect(createArgs.data.members.create.role).toBe('OWNER')
  })
})
