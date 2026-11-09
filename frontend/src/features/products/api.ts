import { post, request } from '../../shared/api/client'
import type { Product, ProductInput } from './types'

export const listProducts = () => request<Product[]>('/products')
export const createProduct = (data: ProductInput) => post<Product>('/products', data)
