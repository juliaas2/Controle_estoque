import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { PackagePlus, X } from 'lucide-react'
import type { ProductInput } from './types'

interface Props {
  busy: boolean
  error: string
  onClose: () => void
  onSubmit: (data: ProductInput) => Promise<boolean>
}

export function ProductForm({ busy, error, onClose, onSubmit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    setFailed(false)
    if (await onSubmit({ name: name.trim(), sku: sku.trim() })) onClose()
    else setFailed(true)
  }
  return (
    <dialog
      ref={dialog}
      className="product-dialog"
      aria-labelledby="new-product-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="dialog-heading">
        <span className="dialog-icon">
          <PackagePlus size={24} />
        </span>
        <button
          aria-label="Fechar cadastro"
          className="icon-button"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="new-product-title">Novo produto</h2>
      <p>Cadastre o produto e registre a primeira entrada.</p>
      <form onSubmit={submit}>
        <label>
          Nome do produto
          <input
            autoFocus
            required
            maxLength={120}
            placeholder="Ex.: Caderno pontilhado"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          SKU
          <input
            required
            maxLength={64}
            pattern="[a-zA-Z0-9._\-]+"
            title="Use letras, números, ponto, hífen ou sublinhado."
            placeholder="Ex.: CAD-001"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
          />
        </label>
        <p className="field-help">O SKU é único. O estoque inicial será de 0 unidades.</p>
        {failed && (
          <p role="alert" className="inline-error">
            {error || 'Não foi possível cadastrar o produto. Tente novamente.'}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy || !name.trim() || !sku.trim()}>
            {busy ? 'Cadastrando…' : 'Cadastrar produto'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
