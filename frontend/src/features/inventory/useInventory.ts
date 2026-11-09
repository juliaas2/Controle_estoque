import { useCallback, useEffect, useRef, useState } from 'react'
import { createProduct, listProducts } from '../products/api'
import type { Product, ProductInput } from '../products/types'
import { applyAction, getBlocks, getReservations, getStock, releaseAllocation } from './api'
import type { Action, ActionInput, Snapshot } from './types'

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = useRef<number | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const generation = useRef(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const refresh = useCallback(async (preferred?: number): Promise<boolean> => {
    const current = ++generation.current
    setLoading(true)
    setError('')
    try {
      const items = await listProducts()
      const candidate = preferred ?? selected.current
      const id = items.some((p) => p.id === candidate) ? candidate : (items[0]?.id ?? null)
      const data =
        id === null
          ? null
          : await Promise.all([getStock(id!), getReservations(id!), getBlocks(id!)])
      if (current !== generation.current) return false
      setProducts(items)
      selected.current = id
      setSelectedId(id)
      setSnapshot(data ? { stock: data[0], reservations: data[1], blocks: data[2] } : null)
      setUpdatedAt(new Date())
      return true
    } catch (cause) {
      if (current === generation.current) {
        setSnapshot(null)
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o estoque.')
      }
      return false
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => {
      generation.current++
    }
  }, [refresh])

  async function mutate(action: () => Promise<number | void>, message: string): Promise<boolean> {
    if (locked.current) return false
    locked.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const preferred = await action()
      setNotice(message)
      const refreshed = await refresh(preferred === undefined ? undefined : preferred)
      if (!refreshed) setNotice(`${message} Atualize a página para consultar o saldo mais recente.`)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.')
      return false
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  function selectProduct(id: number) {
    if (locked.current) return
    selected.current = id
    setSelectedId(id)
    setSnapshot(null)
    setNotice('')
    void refresh(id)
  }

  return {
    products,
    selectedId,
    snapshot,
    loading,
    busy,
    error,
    notice,
    updatedAt,
    refresh: () => refresh(),
    selectProduct,
    dismissError: () => setError(''),
    create: (data: ProductInput) =>
      mutate(async () => (await createProduct(data)).id, 'Produto cadastrado com sucesso.'),
    operate: (action: Action, data: ActionInput) =>
      mutate(async () => {
        if (selected.current === null) throw new Error('Selecione um produto.')
        await applyAction(selected.current, action, data)
      }, 'Operação registrada. Estoque atualizado.'),
    release: (type: 'reservations' | 'blocks', id: string) =>
      mutate(
        async () => {
          await releaseAllocation(type, id)
        },
        type === 'reservations' ? 'Reserva liberada.' : 'Bloqueio liberado.',
      ),
  }
}
