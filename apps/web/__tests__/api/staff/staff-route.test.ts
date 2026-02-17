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
const { GET, POST } = await import('../../../app/api/staff/route')

describe('GET /api/staff', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('教職員一覧を取得できる', async () => {
    const staffData = [
      { id: '1', name: '山田太郎', email: 'yamada@test.com', role: 'FULL_TIME_TEACHER', employmentType: 'FULL_TIME', isActive: true, maxWeeklyLessons: 25 },
      { id: '2', name: '鈴木花子', email: 'suzuki@test.com', role: 'PART_TIME_TEACHER', employmentType: 'PART_TIME', isActive: true, maxWeeklyLessons: null },
    ]
    mockPrisma.staff.findMany.mockResolvedValue(staffData)
    mockPrisma.staff.count.mockResolvedValue(2)

    const request = createRequest('/api/staff?page=1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].name).toBe('山田太郎')
    expect(json.pagination.total).toBe(2)
  })

  it('役職でフィルタできる', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([])
    mockPrisma.staff.count.mockResolvedValue(0)

    const request = createRequest('/api/staff?role=PRINCIPAL')
    await GET(request)

    // findMany に role フィルタが渡されていることを確認
    const callArgs = mockPrisma.staff.findMany.mock.calls[0][0]
    expect(callArgs.where.role).toBe('PRINCIPAL')
  })

  it('氏名で検索できる', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([])
    mockPrisma.staff.count.mockResolvedValue(0)

    const request = createRequest('/api/staff?search=山田')
    await GET(request)

    const callArgs = mockPrisma.staff.findMany.mock.calls[0][0]
    expect(callArgs.where.OR).toBeDefined()
    expect(callArgs.where.OR[0].name.contains).toBe('山田')
  })

  it('在職状況でフィルタできる', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([])
    mockPrisma.staff.count.mockResolvedValue(0)

    const request = createRequest('/api/staff?isActive=true')
    await GET(request)

    const callArgs = mockPrisma.staff.findMany.mock.calls[0][0]
    expect(callArgs.where.isActive).toBe(true)
  })
})

describe('POST /api/staff', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('教職員を登録できる', async () => {
    const newStaff = {
      id: 'new-id',
      name: '田中一郎',
      email: 'tanaka@test.com',
      role: 'FULL_TIME_TEACHER',
      employmentType: 'FULL_TIME',
      isActive: true,
    }
    mockPrisma.staff.create.mockResolvedValue(newStaff)

    const request = createRequest('/api/staff', {
      method: 'POST',
      body: {
        name: '田中一郎',
        email: 'tanaka@test.com',
        role: 'FULL_TIME_TEACHER',
        employmentType: 'FULL_TIME',
        hireDate: '2024-04-01',
      },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('田中一郎')
  })

  it('氏名なしで登録するとバリデーションエラー', async () => {
    const request = createRequest('/api/staff', {
      method: 'POST',
      body: {
        name: '',
        role: 'FULL_TIME_TEACHER',
        employmentType: 'FULL_TIME',
        hireDate: '2024-04-01',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正な役職で登録するとバリデーションエラー', async () => {
    const request = createRequest('/api/staff', {
      method: 'POST',
      body: {
        name: '田中一郎',
        role: 'INVALID_ROLE',
        employmentType: 'FULL_TIME',
        hireDate: '2024-04-01',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
