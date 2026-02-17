import { vi } from 'vitest'

/**
 * Prisma クライアントのモック
 * 各テストで prisma.xxx.findMany 等をモックするための基盤
 */
export function createMockPrisma() {
  return {
    staff: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    teacherQualification: {
      findMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
    },
    documentTemplate: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    generatedDocument: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    sswCase: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    caseDocument: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    sswInvoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    supportPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>
