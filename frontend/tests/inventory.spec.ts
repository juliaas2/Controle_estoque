import { test, expect } from '@playwright/test'

test('cadastro, entrada, reserva, conflito, bloqueio, saída e liberação pela interface', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Seu estoque começa aqui' })).toBeVisible()
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await page.getByLabel('Nome do produto').fill('Produto de teste')
  await page.getByLabel('SKU', { exact: true }).fill('E2E-001')
  await page.getByRole('button', { name: 'Cadastrar produto', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Produto de teste' })).toBeVisible()
  await page.getByLabel('Quantidade', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Registrar entrada' }).click()
  await expect(page.getByLabel('Estoque total: 10', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reserva', exact: true }).click()
  await page.getByLabel('Quantidade', { exact: true }).fill('7')
  await page.getByLabel('Solicitação / pedido').fill('PEDIDO-E2E')
  await page.getByRole('button', { name: 'Criar reserva', exact: true }).click()
  await expect(page.getByLabel('Disponível: 3', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Saída', exact: true }).click()
  await page.getByLabel('Quantidade', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByRole('alert')).toContainText('Estoque insuficiente')
  await expect(page.getByLabel('Estoque total: 10', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Liberar reserva PEDIDO-E2E' }).click()
  await expect(page.getByLabel('Disponível: 10', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Bloqueio', exact: true }).click()
  await page.getByLabel('Quantidade', { exact: true }).fill('2')
  await page.getByLabel('Motivo do bloqueio').fill('Inspeção E2E')
  await page.getByRole('button', { name: 'Criar bloqueio', exact: true }).click()
  await expect(page.getByLabel('Bloqueado: 2', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Bloqueios 1' }).click()
  await expect(page.getByText('Inspeção E2E', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Saída', exact: true }).click()
  await page.getByLabel('Quantidade', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByLabel('Disponível: 0', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Liberar bloqueio Sem solicitação' }).click()
  await expect(page.getByLabel('Disponível: 2', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Estoque total: 2', { exact: true })).toBeVisible()
  await page.getByLabel('Somente ativos').check()
  await expect(page.getByText('Nenhum registro por aqui')).toBeVisible()
})

test('layout móvel permite selecionar produto, pesquisar e movimentar', async ({
  page,
  request,
}) => {
  const response = await request.post('http://127.0.0.1:8001/api/products', {
    data: { sku: 'MOBILE-001', name: 'Produto móvel' },
  })
  expect(response.status()).toBe(201)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByLabel('Buscar produtos').fill('MOBILE')
  await page.getByRole('button', { name: 'Produto móvel MOBILE-001' }).click()
  await expect(page.getByRole('heading', { name: 'Produto móvel' })).toBeVisible()
  await page.getByLabel('Quantidade', { exact: true }).fill('12')
  await page.getByRole('button', { name: 'Registrar entrada' }).click()
  await expect(page.getByLabel('Disponível: 12', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('falha de conexão exibe uma mensagem e permite tentar novamente', async ({ page }) => {
  await page.route('**/api/products', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API')
  await page.unroute('**/api/products')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Vamos restabelecer a conexão' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Movimentar estoque' })).toBeVisible()
})
