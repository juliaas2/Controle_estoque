import { Boxes, Check, LockKeyhole, Bookmark } from 'lucide-react'
import type { Stock } from './types'

export function StockSummary({ stock }: { stock: Stock }) {
  const cards = [
    {
      label: 'Estoque total',
      value: stock.total_quantity,
      icon: Boxes,
      color: 'neutral',
      hint: 'Todas as unidades',
    },
    {
      label: 'Disponível',
      value: stock.available_quantity,
      icon: Check,
      color: 'green',
      hint: 'Pronto para utilizar',
    },
    {
      label: 'Reservado',
      value: stock.reserved_quantity,
      icon: Bookmark,
      color: 'amber',
      hint: 'Vinculado a pedidos',
    },
    {
      label: 'Bloqueado',
      value: stock.blocked_quantity,
      icon: LockKeyhole,
      color: 'purple',
      hint: 'Indisponível para uso',
    },
  ]
  return (
    <div className="stock-grid">
      {cards.map(({ label, value, icon: Icon, color, hint }) => (
        <article className={`stock-card ${color}`} key={label} aria-label={`${label}: ${value}`}>
          <div className="stock-label">
            {label}
            <span className="metric-icon">
              <Icon size={17} />
            </span>
          </div>
          <div className="metric-value">
            {value.toLocaleString('pt-BR')}
            <span>un.</span>
          </div>
          <p>{hint}</p>
        </article>
      ))}
    </div>
  )
}
