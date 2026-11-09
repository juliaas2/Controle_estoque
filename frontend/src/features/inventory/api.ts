import { post, request } from '../../shared/api/client'
import type { Action, ActionInput, Block, Reservation, Stock } from './types'

export const getStock = (id: number) => request<Stock>(`/products/${id}/stock`)
export const getReservations = (id: number) =>
  request<Reservation[]>(`/products/${id}/reservations`)
export const getBlocks = (id: number) => request<Block[]>(`/products/${id}/blocks`)
export const applyAction = (id: number, action: Action, data: ActionInput) =>
  post(`/products/${id}/${action}`, data)
export const releaseAllocation = (type: 'reservations' | 'blocks', id: string) =>
  post(`/${type}/${id}/release`)
