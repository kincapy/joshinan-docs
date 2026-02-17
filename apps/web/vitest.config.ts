import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@joshinan/domain': path.resolve(__dirname, '../../packages/domain/src'),
      '@joshinan/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
})
