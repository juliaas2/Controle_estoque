import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx'],
    testTimeout: 20000,
    hookTimeout: 20000,
    maxWorkers: 1,
    env: { VITE_API_URL: 'http://127.0.0.1:8002/api' },
  },
})
