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
const { GET, PUT } = await import('../../../app/api/staff/[id]/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/staff/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('教職員詳細を資格情報付きで取得できる', async () => {
    const staffData = {
      id: 'staff-1',
      name: '山田太郎',
      email: 'yamada@test.com',
      role: 'FULL_TIME_TEACHER',
      employmentType: 'FULL_TIME',
      isActive: true,
      qualifications: [
        { id: 'q-1', qualificationType: 'TRAINING_420H', acquiredDate: new Date('2020-03-01'), expirationDate: null, notes: null },
      ],
    }
    mockPrisma.staff.findUniqueOrThrow.mockResolvedValue(staffData)

    const request = createRequest('/api/staff/staff-1')
    const response = await GET(request, routeParams('staff-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('山田太郎')
    expect(json.data.qualifications).toHaveLength(1)
  })

  it('存在しない教職員IDで404エラー', async () => {
    const error = new Error('Record not found')
    ;(error as any).code = 'P2025'
    ;(error as any).clientVersion = '5.0.0'
    Object.setPrototypeOf(error, Object.getPrototypeOf(new (await import('@joshinan/database')).Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '5.0.0' })))

    mockPrisma.staff.findUniqueOrThrow.mockRejectedValue(
      new (await import('@joshinan/database')).Prisma.PrismaClientKnownRequestError(
        'Record not found', { code: 'P2025', clientVersion: '5.0.0' }
      )
    )

    const request = createRequest('/api/staff/nonexistent')
    const response = await GET(request, routeParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})

describe('PUT /api/staff/:id', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('教職員情報を更新できる', async () => {
    const updatedStaff = {
      id: 'staff-1',
      name: '山田次郎',
      role: 'HEAD_TEACHER',
    }
    mockPrisma.staff.update.mockResolvedValue(updatedStaff)

    const request = createRequest('/api/staff/staff-1', {
      method: 'PUT',
      body: { name: '山田次郎', role: 'HEAD_TEACHER' },
    })

    const response = await PUT(request, routeParams('staff-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('山田次郎')
  })

  it('退職日を設定すると isActive が自動で false になる', async () => {
    mockPrisma.staff.update.mockResolvedValue({ id: 'staff-1', isActive: false })

    const request = createRequest('/api/staff/staff-1', {
      method: 'PUT',
      body: { resignationDate: '2024-12-31' },
    })

    await PUT(request, routeParams('staff-1'))

    // update に渡されたデータに isActive: false が含まれることを確認
    const updateData = mockPrisma.staff.update.mock.calls[0][0].data
    expect(updateData.isActive).toBe(false)
  })
})
