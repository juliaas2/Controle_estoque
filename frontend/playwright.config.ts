import { defineConfig, devices } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'

const database = join(mkdtempSync(join(tmpdir(), 'estoque-e2e-')), 'e2e.db')
const python =
  process.env.E2E_PYTHON ||
  resolve('../backend/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    launchOptions: process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `"${python}" -m uvicorn app.main:app --host 127.0.0.1 --port 8001`,
      cwd: '../backend',
      url: 'http://127.0.0.1:8001/api/health',
      reuseExistingServer: false,
      env: { DATABASE_PATH: database, CORS_ORIGINS: 'http://127.0.0.1:5174' },
    },
    {
      command: 'npm run dev -- --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:8001/api' },
    },
  ],
})
