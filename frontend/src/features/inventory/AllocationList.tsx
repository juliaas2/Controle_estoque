import { Archive, CornerUpLeft } from 'lucide-react'
import type { Allocation } from './types'

interface Item extends Allocation {
  reference: string
  description?: string
}
interface Props {
  items: Item[]
  busy: boolean
  type: 'reserva' | 'bloqueio'
  onRelease: (id: string) => void
}

export function AllocationList({ items, busy, type, onRelease }: Props) {
  if (items.length === 0)
    return (
      <div className="empty-history">
        <Archive size={28} />
        <strong>Nenhum registro por aqui</strong>
        <span>
          As {type === 'reserva' ? 'reservas' : 'unidades bloqueadas'} aparecerão nesta lista.
        </span>
      </div>
    )
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Referência / identificação</th>
            <th>Quantidade</th>
            <th>Situação</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.reference}</strong>
                {item.description && <span className="cell-description">{item.description}</span>}
                <details>
                  <summary className="record-id">Ver identificação</summary>
                  <code>{item.id}</code>
                  <small>
                    Criado em {new Date(item.created_at).toLocaleString('pt-BR')}
                    {item.released_at &&
                      ` · Liberado em ${new Date(item.released_at).toLocaleString('pt-BR')}`}
                  </small>
                </details>
              </td>
              <td className="quantity-cell">
                {item.quantity.toLocaleString('pt-BR')} <span>un.</span>
              </td>
              <td>
                <span
                  className={`badge ${item.released_at ? 'released' : type === 'reserva' ? 'reserved' : 'blocked'}`}
                >
                  {item.released_at ? 'Liberado' : 'Ativo'}
                </span>
              </td>
              <td>
                {!item.released_at && (
                  <button
                    className="release-button"
                    disabled={busy}
                    onClick={() => onRelease(item.id)}
                    aria-label={`Liberar ${type} ${item.reference}`}
                  >
                    <CornerUpLeft size={15} />
                    Liberar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
