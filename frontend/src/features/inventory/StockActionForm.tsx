import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bookmark, LockKeyhole, ArrowRight } from 'lucide-react'
import type { Action, ActionInput } from './types'

const actions = [
  {
    id: 'entries',
    label: 'Entrada',
    icon: ArrowDownLeft,
    description: 'Adicione novas unidades ao estoque deste produto.',
    button: 'Registrar entrada',
  },
  {
    id: 'outputs',
    label: 'Saída',
    icon: ArrowUpRight,
    description: 'Retire unidades disponíveis do estoque.',
    button: 'Registrar saída',
  },
  {
    id: 'reservations',
    label: 'Reserva',
    icon: Bookmark,
    description: 'Separe unidades disponíveis para uma solicitação ou pedido.',
    button: 'Criar reserva',
  },
  {
    id: 'blocks',
    label: 'Bloqueio',
    icon: LockKeyhole,
    description: 'Torne unidades indisponíveis e registre o motivo.',
    button: 'Criar bloqueio',
  },
] as const

interface Props {
  busy: boolean
  available: number
  onSubmit: (action: Action, data: ActionInput) => Promise<boolean>
}

export function StockActionForm({ busy, available, onSubmit }: Props) {
  const [action, setAction] = useState<Action>('entries')
  const [quantity, setQuantity] = useState('')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const option = actions.find((item) => item.id === action)!
  async function submit(event: FormEvent) {
    event.preventDefault()
    const data: ActionInput = { quantity: Number(quantity) }
    if (action === 'reservations' || (action === 'blocks' && reference.trim()))
      data.request_id = reference.trim()
    if (action === 'blocks') data.reason = reason.trim()
    if (await onSubmit(action, data)) {
      setQuantity('')
      setReference('')
      setReason('')
    }
  }
  return (
    <section className="panel operation-panel">
      <div className="panel-heading">
        <h2>Movimentar estoque</h2>
        <span className="subtle">Uma operação por vez</span>
      </div>
      <div className="action-tabs" role="group" aria-label="Tipo de operação">
        {actions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={action === id}
            className={action === id ? 'active' : ''}
            disabled={busy}
            onClick={() => setAction(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      <p className="operation-description">{option.description}</p>
      <form onSubmit={submit}>
        <div className="operation-fields">
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              max="1000000000"
              step="1"
              required
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={busy}
            />
          </label>
          {(action === 'reservations' || action === 'blocks') && (
            <label>
              {action === 'reservations' ? 'Solicitação / pedido' : 'Solicitação (opcional)'}
              <input
                required={action === 'reservations'}
                maxLength={80}
                placeholder="Ex.: PEDIDO-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={busy}
              />
            </label>
          )}
          {action === 'blocks' && (
            <label className="reason-field">
              Motivo do bloqueio
              <input
                required
                maxLength={240}
                placeholder="Ex.: Aguardando inspeção"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
              />
            </label>
          )}
        </div>
        <div className="operation-footer">
          <span className="field-help">
            {action === 'entries'
              ? 'A entrada aumenta a quantidade total.'
              : `${available.toLocaleString('pt-BR')} unidades disponíveis nesta consulta.`}
          </span>
          <button className="button primary" disabled={busy || !quantity || Number(quantity) <= 0}>
            {busy ? 'Processando…' : option.button}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </section>
  )
}
