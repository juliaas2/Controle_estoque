import { AlertCircle, X } from 'lucide-react'

export function ErrorMessage({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={19} />
      <span>{message}</span>
      {onDismiss && (
        <button className="icon-button" onClick={onDismiss} aria-label="Fechar mensagem de erro">
          <X size={17} />
        </button>
      )}
    </div>
  )
}
