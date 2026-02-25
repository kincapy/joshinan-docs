import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrisma, type MockPrisma } from '../../../helpers/mock-prisma'

let mockPrisma: MockPrisma

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

const { updateStudent } = await import(
  '../../../../lib/chat/tools/student-mutation'
)

describe('updateStudent', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('学生の電話番号を更新できる', async () => {
    const currentStudent = {
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
      phone: '090-1111-2222',
      email: null,
      addressJapan: null,
      addressHome: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      passportNumber: null,
      residenceCardNumber: null,
      residenceStatus: null,
      residenceExpiry: null,
      notes: null,
    }

    mockPrisma.student.findUnique.mockResolvedValue(currentStudent)
    mockPrisma.student.update.mockResolvedValue({
      ...currentStudent,
      phone: '090-3333-4444',
    })
    mockPrisma.auditLog.createMany.mockResolvedValue({ count: 1 })

    const result = await updateStudent(
      { studentId: 'student-1', phone: '090-3333-4444' },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(json.studentName).toBe('田中太郎')
    expect(json.changes).toHaveLength(1)
    expect(json.changes[0]).toEqual({
      field: 'phone',
      oldValue: '090-1111-2222',
      newValue: '090-3333-4444',
    })

    // student.update が正しい引数で呼ばれたか
    const updateArgs = mockPrisma.student.update.mock.calls[0][0]
    expect(updateArgs.where.id).toBe('student-1')
    expect(updateArgs.data.phone).toBe('090-3333-4444')

    // AuditLog が書き込まれたか
    const auditArgs = mockPrisma.auditLog.createMany.mock.calls[0][0]
    expect(auditArgs.data).toHaveLength(1)
    expect(auditArgs.data[0].userId).toBe('user-1')
    expect(auditArgs.data[0].tableName).toBe('students')
    expect(auditArgs.data[0].action).toBe('UPDATE')
  })

  it('複数フィールドを同時に更新できる', async () => {
    const currentStudent = {
      id: 'student-2',
      nameKanji: null,
      nameEn: 'Li Ming',
      phone: null,
      email: null,
      addressJapan: '東京都新宿区1-1-1',
      addressHome: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      passportNumber: null,
      residenceCardNumber: null,
      residenceStatus: null,
      residenceExpiry: null,
      notes: null,
    }

    mockPrisma.student.findUnique.mockResolvedValue(currentStudent)
    mockPrisma.student.update.mockResolvedValue({
      ...currentStudent,
      phone: '080-1234-5678',
      addressJapan: '東京都渋谷区2-2-2',
    })
    mockPrisma.auditLog.createMany.mockResolvedValue({ count: 2 })

    const result = await updateStudent(
      {
        studentId: 'student-2',
        phone: '080-1234-5678',
        addressJapan: '東京都渋谷区2-2-2',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(json.studentName).toBe('Li Ming')
    expect(json.changes).toHaveLength(2)

    // AuditLog が2件書き込まれたか
    const auditArgs = mockPrisma.auditLog.createMany.mock.calls[0][0]
    expect(auditArgs.data).toHaveLength(2)
  })

  it('存在しない学生IDでエラーを返す', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null)

    const result = await updateStudent(
      { studentId: 'nonexistent', phone: '090-0000-0000' },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.error).toBe('学生が見つかりません')
    expect(mockPrisma.student.update).not.toHaveBeenCalled()
  })

  it('学生IDが未指定でエラーを返す', async () => {
    const result = await updateStudent({}, { userId: 'user-1' })
    const json = JSON.parse(result)

    expect(json.error).toBe('学生IDは必須です')
  })

  it('更新フィールドが未指定でエラーを返す', async () => {
    const currentStudent = {
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
      phone: null,
      email: null,
      addressJapan: null,
      addressHome: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      passportNumber: null,
      residenceCardNumber: null,
      residenceStatus: null,
      residenceExpiry: null,
      notes: null,
    }
    mockPrisma.student.findUnique.mockResolvedValue(currentStudent)

    const result = await updateStudent(
      { studentId: 'student-1' },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.error).toBe('更新するフィールドが指定されていません')
  })

  it('不正な日付形式でエラーを返す', async () => {
    const currentStudent = {
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
      phone: null,
      email: null,
      addressJapan: null,
      addressHome: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      passportNumber: null,
      residenceCardNumber: null,
      residenceStatus: null,
      residenceExpiry: null,
      notes: null,
    }
    mockPrisma.student.findUnique.mockResolvedValue(currentStudent)

    const result = await updateStudent(
      { studentId: 'student-1', residenceExpiry: 'invalid-date' },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.error).toContain('日付形式が正しくありません')
  })

  it('context なしでも更新は実行される（AuditLog は書き込まれない）', async () => {
    const currentStudent = {
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
      phone: '090-1111-2222',
      email: null,
      addressJapan: null,
      addressHome: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      passportNumber: null,
      residenceCardNumber: null,
      residenceStatus: null,
      residenceExpiry: null,
      notes: null,
    }

    mockPrisma.student.findUnique.mockResolvedValue(currentStudent)
    mockPrisma.student.update.mockResolvedValue({
      ...currentStudent,
      phone: '090-9999-8888',
    })

    const result = await updateStudent({
      studentId: 'student-1',
      phone: '090-9999-8888',
    })
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(mockPrisma.auditLog.createMany).not.toHaveBeenCalled()
  })
})
