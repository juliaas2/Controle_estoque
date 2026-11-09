export interface Product {
  id: number
  sku: string
  name: string
  total_quantity: number
  created_at: string
}
export interface ProductInput {
  sku: string
  name: string
}
