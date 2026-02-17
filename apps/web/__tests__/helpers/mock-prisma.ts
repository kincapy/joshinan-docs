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
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
    },
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>
