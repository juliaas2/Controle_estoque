import { LoaderCircle } from 'lucide-react'

export function Loading({ text = 'Carregando estoque…' }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={20} className="spin" />
      {text}
    </div>
  )
}
