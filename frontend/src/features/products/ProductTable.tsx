import { ChevronRight, Package, Search } from 'lucide-react'
import { useState } from 'react'
import type { Product } from './types'

interface Props {
  products: Product[]
  selectedId: number | null
  disabled: boolean
  onSelect: (id: number) => void
}

export function ProductTable({ products, selectedId, disabled, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const filtered = products.filter((product) =>
    `${product.name} ${product.sku}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR')),
  )
  return (
    <section className="panel catalog">
      <div className="panel-heading">
        <h2>
          Produtos <span className="count">{products.length}</span>
        </h2>
        <Package size={18} />
      </div>
      <label className="search">
        <Search size={17} />
        <input
          aria-label="Buscar produtos"
          placeholder="Buscar nome ou SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="product-list" aria-label="Lista de produtos">
        {filtered.map((product) => (
          <button
            key={product.id}
            disabled={disabled}
            aria-pressed={product.id === selectedId}
            className={`product-item ${product.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(product.id)}
          >
            <span className="product-icon">
              <Package size={20} />
            </span>
            <span className="product-label">
              <strong>{product.name}</strong>
              <small>{product.sku}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="empty-small">
            {products.length ? 'Nenhum produto encontrado.' : 'Seus produtos aparecerão aqui.'}
          </p>
        )}
      </div>
      <div className="catalog-footer">
        <span className="dot" />
        Selecione um produto para gerenciar
      </div>
    </section>
  )
}
