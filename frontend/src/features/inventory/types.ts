export interface Stock {
  product_id: number
  total_quantity: number
  available_quantity: number
  reserved_quantity: number
  blocked_quantity: number
}
export interface Allocation {
  id: string
  product_id: number
  quantity: number
  created_at: string
  released_at: string | null
}
export interface Reservation extends Allocation {
  request_id: string
}
export interface Block extends Allocation {
  request_id: string | null
  reason: string
}
export type Action = 'entries' | 'outputs' | 'reservations' | 'blocks'
export interface ActionInput {
  quantity: number
  request_id?: string
  reason?: string
}
export interface Snapshot {
  stock: Stock
  reservations: Reservation[]
  blocks: Block[]
}
