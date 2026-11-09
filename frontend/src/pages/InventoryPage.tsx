import { useState } from 'react'
import {
  ArrowUpRight,
  Box,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useInventory } from '../features/inventory/useInventory'
import { StockSummary } from '../features/inventory/StockSummary'
import { StockActionForm } from '../features/inventory/StockActionForm'
import { ReservationsList } from '../features/inventory/ReservationsList'
import { BlocksList } from '../features/inventory/BlocksList'
import { ProductTable } from '../features/products/ProductTable'
import { ProductForm } from '../features/products/ProductForm'
import { ErrorMessage } from '../shared/components/ErrorMessage'
import { Loading } from '../shared/components/Loading'
import { API_URL } from '../shared/api/client'

export function InventoryPage() {
  const inventory = useInventory()
  const [showProductForm, setShowProductForm] = useState(false)
  const [tab, setTab] = useState<'reservations' | 'blocks'>('reservations')
  const [onlyActive, setOnlyActive] = useState(false)
  const product = inventory.products.find((item) => item.id === inventory.selectedId)
  const { snapshot, busy, loading } = inventory
  const disabled = busy || loading
  const reservations =
    snapshot?.reservations.filter((item) => !onlyActive || !item.released_at) ?? []
  const blocks = snapshot?.blocks.filter((item) => !onlyActive || !item.released_at) ?? []
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="Fluxo, início">
          <span>
            <Box size={23} />
          </span>
          fluxo<span className="brand-point">.</span>
        </a>
        <p className="nav-caption">SEU ESPAÇO DE TRABALHO</p>
        <nav>
          <a href="#estoque" className="nav-item active" aria-current="page">
            <LayoutDashboard size={18} />
            Estoque
            <span className="nav-dot" />
          </a>
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <Boxes size={25} />
          </div>
          <h3>
            Cada unidade
            <br />
            no lugar certo.
          </h3>
          <p>Disponibilidade, reservas e bloqueios em uma única visão.</p>
          <span>
            Controle com clareza <ArrowUpRight size={15} />
          </span>
        </div>
        <a
          className="api-link"
          href={API_URL.replace(/\/api$/, '/docs')}
          target="_blank"
          rel="noreferrer"
        >
          <CircleHelp size={17} />
          Documentação da API
          <ArrowUpRight size={15} />
        </a>
        <div className="sidebar-bottom">
          <span className="avatar">CE</span>
          <div>
            <strong>Controle de estoque</strong>
            <small>Workspace local</small>
          </div>
        </div>
      </aside>
      <main id="estoque">
        <header className="topbar">
          <div>
            Operações <ChevronRight size={14} />
            <span>Estoque</span>
          </div>
          <span className="workspace-status">
            <span className="dot" />
            Controle local
          </span>
        </header>
        <div className="main-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">VISÃO OPERACIONAL</p>
              <h1>Controle de estoque</h1>
              <p>Acompanhe seus produtos. Mantenha cada quantidade sob controle.</p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                onClick={() => void inventory.refresh()}
                disabled={disabled}
                aria-label="Atualizar estoque"
              >
                <RefreshCw size={17} className={loading ? 'spin' : ''} />
                <span>Atualizar</span>
              </button>
              <button
                className="button primary"
                onClick={() => setShowProductForm(true)}
                disabled={busy}
              >
                <Plus size={18} />
                Novo produto
              </button>
            </div>
          </section>
          {inventory.error && (
            <ErrorMessage message={inventory.error} onDismiss={inventory.dismissError} />
          )}
          {inventory.notice && (
            <div className="notice success" role="status">
              <CheckCircle2 size={18} />
              {inventory.notice}
            </div>
          )}
          <div className="workspace-grid">
            <ProductTable
              products={inventory.products}
              selectedId={inventory.selectedId}
              disabled={busy}
              onSelect={inventory.selectProduct}
            />
            <div className="detail-area">
              {loading && !snapshot ? (
                <div className="panel initial-state">
                  <Loading />
                </div>
              ) : snapshot && product ? (
                <>
                  <section className="product-heading">
                    <div>
                      <div className="product-eyebrow">
                        PRODUTO SELECIONADO <span>{product.sku}</span>
                      </div>
                      <h2>{product.name}</h2>
                    </div>
                    <span className="sync-status">
                      <span className="dot" />
                      Atualizado às{' '}
                      {inventory.updatedAt?.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </section>
                  <StockSummary stock={snapshot.stock} />
                  <StockActionForm
                    key={product.id}
                    busy={disabled}
                    available={snapshot.stock.available_quantity}
                    onSubmit={inventory.operate}
                  />
                  <section className="panel history-panel">
                    <div className="panel-heading">
                      <h2>Reservas e bloqueios</h2>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={onlyActive}
                          onChange={(e) => setOnlyActive(e.target.checked)}
                        />
                        Somente ativos
                      </label>
                    </div>
                    <div className="history-tabs" role="group" aria-label="Registros">
                      <button
                        aria-pressed={tab === 'reservations'}
                        className={tab === 'reservations' ? 'active' : ''}
                        onClick={() => setTab('reservations')}
                      >
                        Reservas <span>{snapshot.reservations.length}</span>
                      </button>
                      <button
                        aria-pressed={tab === 'blocks'}
                        className={tab === 'blocks' ? 'active' : ''}
                        onClick={() => setTab('blocks')}
                      >
                        Bloqueios <span>{snapshot.blocks.length}</span>
                      </button>
                    </div>
                    {tab === 'reservations' ? (
                      <ReservationsList
                        items={reservations}
                        busy={disabled}
                        onRelease={(id) => void inventory.release('reservations', id)}
                      />
                    ) : (
                      <BlocksList
                        items={blocks}
                        busy={disabled}
                        onRelease={(id) => void inventory.release('blocks', id)}
                      />
                    )}
                  </section>
                  <div className="consistency-note">
                    <ShieldCheck size={15} />
                    Total = disponível + reservado + bloqueado
                  </div>
                </>
              ) : (
                <div className="panel initial-state">
                  <span className="empty-icon">
                    <Boxes size={38} />
                  </span>
                  <h2>
                    {inventory.error ? 'Vamos restabelecer a conexão' : 'Seu estoque começa aqui'}
                  </h2>
                  <p>
                    {inventory.error
                      ? 'Inicie o backend e clique em Atualizar para tentar novamente.'
                      : 'Cadastre seu primeiro produto para registrar entradas, reservas e bloqueios.'}
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      inventory.error ? void inventory.refresh() : setShowProductForm(true)
                    }
                  >
                    {inventory.error ? <RefreshCw size={17} /> : <Plus size={17} />}
                    {inventory.error ? 'Tentar novamente' : 'Cadastrar primeiro produto'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <footer className="page-footer">
            <span>Fluxo · Gestão de estoque</span>
            <span>Organização que acompanha cada movimento.</span>
          </footer>
        </div>
      </main>
      {showProductForm && (
        <ProductForm
          busy={busy}
          error={inventory.error}
          onClose={() => setShowProductForm(false)}
          onSubmit={inventory.create}
        />
      )}
    </div>
  )
}
