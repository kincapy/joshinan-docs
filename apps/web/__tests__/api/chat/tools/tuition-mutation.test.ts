import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrisma, type MockPrisma } from '../../../helpers/mock-prisma'

let mockPrisma: MockPrisma

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

const { recordPayment } = await import(
  '../../../../lib/chat/tools/tuition-mutation'
)

describe('recordPayment', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('現金入金を記録できる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
    })
    mockPrisma.payment.create.mockResolvedValue({
      id: 'payment-1',
      studentId: 'student-1',
      paymentDate: new Date('2026-02-25'),
      amount: 50000,
      method: 'CASH',
      invoiceId: null,
      notes: null,
    })
    mockPrisma.auditLog.createMany.mockResolvedValue({ count: 1 })

    const result = await recordPayment(
      {
        studentId: 'student-1',
        paymentDate: '2026-02-25',
        amount: 50000,
        method: 'CASH',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(json.paymentId).toBe('payment-1')
    expect(json.studentName).toBe('田中太郎')
    expect(json.amount).toBe(50000)
    expect(json.method).toBe('現金')

    // payment.create が呼ばれたか
    const createArgs = mockPrisma.payment.create.mock.calls[0][0]
    expect(createArgs.data.studentId).toBe('student-1')
    expect(createArgs.data.method).toBe('CASH')

    // AuditLog が書き込まれたか
    const auditArgs = mockPrisma.auditLog.createMany.mock.calls[0][0]
    expect(auditArgs.data).toHaveLength(1)
    expect(auditArgs.data[0].action).toBe('CREATE')
    expect(auditArgs.data[0].tableName).toBe('payments')
  })

  it('銀行振込で請求IDを指定して入金を記録できる', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: null,
      nameEn: 'Li Ming',
    })
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      studentId: 'student-1',
    })
    mockPrisma.payment.create.mockResolvedValue({
      id: 'payment-2',
      studentId: 'student-1',
      paymentDate: new Date('2026-02-20'),
      amount: 80000,
      method: 'BANK_TRANSFER',
      invoiceId: 'invoice-1',
      notes: '2月分学費',
    })
    mockPrisma.auditLog.createMany.mockResolvedValue({ count: 1 })

    const result = await recordPayment(
      {
        studentId: 'student-1',
        paymentDate: '2026-02-20',
        amount: 80000,
        method: 'BANK_TRANSFER',
        invoiceId: 'invoice-1',
        notes: '2月分学費',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(json.method).toBe('銀行振込')
    expect(json.invoiceId).toBe('invoice-1')

    // payment.create で invoiceId が渡されているか
    const createArgs = mockPrisma.payment.create.mock.calls[0][0]
    expect(createArgs.data.invoiceId).toBe('invoice-1')
    expect(createArgs.data.notes).toBe('2月分学費')
  })

  it('日本語の入金方法も受け付ける', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
    })
    mockPrisma.payment.create.mockResolvedValue({
      id: 'payment-3',
      studentId: 'student-1',
      paymentDate: new Date('2026-02-25'),
      amount: 30000,
      method: 'CASH',
      invoiceId: null,
      notes: null,
    })
    mockPrisma.auditLog.createMany.mockResolvedValue({ count: 1 })

    const result = await recordPayment(
      {
        studentId: 'student-1',
        paymentDate: '2026-02-25',
        amount: 30000,
        method: '現金',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(json.method).toBe('現金')
  })

  it('存在しない学生IDでエラーを返す', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null)

    const result = await recordPayment(
      {
        studentId: 'nonexistent',
        paymentDate: '2026-02-25',
        amount: 50000,
        method: 'CASH',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.error).toBe('学生が見つかりません')
    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('存在しない請求IDでエラーを返す', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
    })
    mockPrisma.invoice.findUnique.mockResolvedValue(null)

    const result = await recordPayment(
      {
        studentId: 'student-1',
        paymentDate: '2026-02-25',
        amount: 50000,
        method: 'CASH',
        invoiceId: 'nonexistent-invoice',
      },
      { userId: 'user-1' },
    )
    const json = JSON.parse(result)

    expect(json.error).toBe('指定された請求が見つかりません')
    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('必須パラメータ不足でエラーを返す', async () => {
    // 学生IDなし
    let result = await recordPayment({}, { userId: 'user-1' })
    let json = JSON.parse(result)
    expect(json.error).toBe('学生IDは必須です')

    // 入金日なし
    result = await recordPayment(
      { studentId: 'student-1' },
      { userId: 'user-1' },
    )
    json = JSON.parse(result)
    expect(json.error).toBe('入金日は必須です')

    // 不正な入金額
    result = await recordPayment(
      { studentId: 'student-1', paymentDate: '2026-02-25', amount: 0, method: 'CASH' },
      { userId: 'user-1' },
    )
    json = JSON.parse(result)
    expect(json.error).toContain('入金額は0より大きい値')

    // 不正な入金方法
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
    })
    result = await recordPayment(
      {
        studentId: 'student-1',
        paymentDate: '2026-02-25',
        amount: 50000,
        method: 'CREDIT_CARD',
      },
      { userId: 'user-1' },
    )
    json = JSON.parse(result)
    expect(json.error).toContain('入金方法が正しくありません')
  })

  it('context なしでも入金は記録される（AuditLog は書き込まれない）', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      nameKanji: '田中太郎',
      nameEn: 'Tanaka Taro',
    })
    mockPrisma.payment.create.mockResolvedValue({
      id: 'payment-4',
      studentId: 'student-1',
      paymentDate: new Date('2026-02-25'),
      amount: 50000,
      method: 'CASH',
      invoiceId: null,
      notes: null,
    })

    const result = await recordPayment({
      studentId: 'student-1',
      paymentDate: '2026-02-25',
      amount: 50000,
      method: 'CASH',
    })
    const json = JSON.parse(result)

    expect(json.success).toBe(true)
    expect(mockPrisma.auditLog.createMany).not.toHaveBeenCalled()
  })
})
