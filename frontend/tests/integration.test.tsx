import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import App from '../src/App'

let backend: ChildProcess
let directory: string
let logs = ''
const origin = 'http://127.0.0.1:8002'

beforeAll(async () => {
  const existing = await fetch(`${origin}/api/health`).catch(() => null)
  if (existing) throw new Error('A porta 8002 está ocupada. Encerre o processo antes do teste.')
  // jsdom models DOM behavior, not native dialog focus or visual layout.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  directory = await mkdtemp(join(tmpdir(), 'estoque-integration-'))
  const python =
    process.env.E2E_PYTHON ||
    resolve('../backend/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  backend = spawn(
    python,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8002'],
    {
      cwd: resolve('../backend'),
      env: { ...process.env, DATABASE_PATH: join(directory, 'integration.db') },
    },
  )
  backend.stdout?.on('data', (data) => {
    logs += data.toString()
  })
  backend.stderr?.on('data', (data) => {
    logs += data.toString()
  })
  let startupError: Error | undefined
  backend.on('error', (error) => {
    startupError = error
  })
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError
    if (backend.exitCode !== null) throw new Error(`API encerrou: ${logs}`)
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return
    } catch {
      /* Server starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`API não iniciou: ${logs}`)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
afterAll(async () => {
  if (backend && backend.exitCode === null) {
    await new Promise<void>((resolve) => {
      backend.once('exit', () => resolve())
      backend.kill()
    })
  }
  if (directory) await rm(directory, { recursive: true, force: true })
})

describe('React integrado à API real e SQLite temporário', () => {
  test('cadastra e movimenta estoque, rejeita conflito e libera registros', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Seu estoque começa aqui' })
    await user.click(screen.getByRole('button', { name: 'Novo produto', exact: true }))
    await user.type(screen.getByLabelText('Nome do produto'), 'Caderno integração')
    await user.type(screen.getByLabelText('SKU', { exact: true }), 'TEST-001')
    await user.click(screen.getByRole('button', { name: 'Cadastrar produto', exact: true }))
    await screen.findByRole('heading', { name: 'Caderno integração' })
    await user.type(screen.getByLabelText('Quantidade', { exact: true }), '10')
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }))
    await screen.findByLabelText('Estoque total: 10', { exact: true })
    await user.click(screen.getByRole('button', { name: 'Reserva', exact: true }))
    await user.type(screen.getByLabelText('Quantidade', { exact: true }), '7')
    await user.type(screen.getByLabelText('Solicitação / pedido'), 'PEDIDO-TESTE')
    await user.click(screen.getByRole('button', { name: 'Criar reserva', exact: true }))
    await screen.findByLabelText('Disponível: 3', { exact: true })
    await user.click(screen.getByRole('button', { name: 'Saída', exact: true }))
    await user.type(screen.getByLabelText('Quantidade', { exact: true }), '4')
    await user.click(screen.getByRole('button', { name: 'Registrar saída' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Estoque insuficiente')
    expect(screen.getByLabelText('Estoque total: 10', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Liberar reserva PEDIDO-TESTE' }))
    await screen.findByLabelText('Disponível: 10', { exact: true })
    await user.click(screen.getByRole('button', { name: 'Bloqueio', exact: true }))
    await user.clear(screen.getByLabelText('Quantidade', { exact: true }))
    await user.type(screen.getByLabelText('Quantidade', { exact: true }), '2')
    await user.type(screen.getByLabelText('Motivo do bloqueio'), 'Inspeção')
    await user.click(screen.getByRole('button', { name: 'Criar bloqueio', exact: true }))
    await screen.findByLabelText('Bloqueado: 2', { exact: true })
    await user.click(screen.getByRole('button', { name: 'Bloqueios 1' }))
    await user.click(screen.getByRole('button', { name: 'Saída', exact: true }))
    await user.type(screen.getByLabelText('Quantidade', { exact: true }), '8')
    await user.click(screen.getByRole('button', { name: 'Registrar saída' }))
    await screen.findByLabelText('Disponível: 0', { exact: true })
    await user.click(screen.getByRole('button', { name: 'Liberar bloqueio Sem solicitação' }))
    await screen.findByLabelText('Disponível: 2', { exact: true })
    await user.click(screen.getByLabelText('Somente ativos'))
    expect(screen.getByText('Nenhum registro por aqui')).toBeInTheDocument()
    cleanup()
    render(<App />)
    await screen.findByLabelText('Estoque total: 2', { exact: true })
  })

  test('SKU duplicado mantém o formulário aberto com erro compreensível', async () => {
    await fetch(`${origin}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'DUP-001', name: 'Original' }),
    })
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Movimentar estoque' })
    await user.click(screen.getByRole('button', { name: 'Novo produto', exact: true }))
    await user.type(screen.getByLabelText('Nome do produto'), 'Duplicado')
    await user.type(screen.getByLabelText('SKU', { exact: true }), 'DUP-001')
    await user.click(screen.getByRole('button', { name: 'Cadastrar produto', exact: true }))
    const dialog = screen.getByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Já existe um produto com esse SKU',
    )
    expect(
      within(dialog).getByRole('button', { name: 'Cadastrar produto', exact: true }),
    ).toBeEnabled()
  })

  test('falha de rede pode ser recuperada por atualização manual', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Falha simulada'))
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await screen.findByRole('heading', { name: 'Movimentar estoque' })
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
