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
const { GET, POST, DELETE } = await import('../../../app/api/staff/[id]/qualifications/route')

/** Route パラメータのヘルパー */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/staff/:id/qualifications', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('資格一覧を取得できる', async () => {
    mockPrisma.staff.findUniqueOrThrow.mockResolvedValue({ id: 'staff-1' })
    const qualifications = [
      { id: 'q-1', qualificationType: 'TRAINING_420H', acquiredDate: null, expirationDate: null, notes: null },
      { id: 'q-2', qualificationType: 'REGISTERED_TEACHER', acquiredDate: null, expirationDate: new Date('2030-03-31'), notes: '登録済み' },
    ]
    mockPrisma.teacherQualification.findMany.mockResolvedValue(qualifications)

    const request = createRequest('/api/staff/staff-1/qualifications')
    const response = await GET(request, routeParams('staff-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
  })
})

describe('POST /api/staff/:id/qualifications', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('資格を登録できる', async () => {
    mockPrisma.staff.findUniqueOrThrow.mockResolvedValue({ id: 'staff-1' })
    const newQualification = {
      id: 'q-new',
      staffId: 'staff-1',
      qualificationType: 'CERTIFICATION_EXAM',
      acquiredDate: new Date('2023-10-15'),
      expirationDate: null,
      notes: null,
    }
    mockPrisma.teacherQualification.create.mockResolvedValue(newQualification)

    const request = createRequest('/api/staff/staff-1/qualifications', {
      method: 'POST',
      body: {
        qualificationType: 'CERTIFICATION_EXAM',
        acquiredDate: '2023-10-15',
      },
    })

    const response = await POST(request, routeParams('staff-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.qualificationType).toBe('CERTIFICATION_EXAM')
  })

  it('不正な資格種別で登録するとバリデーションエラー', async () => {
    mockPrisma.staff.findUniqueOrThrow.mockResolvedValue({ id: 'staff-1' })

    const request = createRequest('/api/staff/staff-1/qualifications', {
      method: 'POST',
      body: {
        qualificationType: 'INVALID_TYPE',
      },
    })

    const response = await POST(request, routeParams('staff-1'))
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/staff/:id/qualifications', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('資格を削除できる', async () => {
    mockPrisma.teacherQualification.findFirstOrThrow.mockResolvedValue({ id: 'q-1', staffId: 'staff-1' })
    mockPrisma.teacherQualification.delete.mockResolvedValue({ id: 'q-1' })

    const request = createRequest('/api/staff/staff-1/qualifications?qualificationId=q-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, routeParams('staff-1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.deleted).toBe(true)
  })

  it('qualificationId なしで削除するとバリデーションエラー', async () => {
    const request = createRequest('/api/staff/staff-1/qualifications', {
      method: 'DELETE',
    })

    const response = await DELETE(request, routeParams('staff-1'))
    expect(response.status).toBe(400)
  })
})
