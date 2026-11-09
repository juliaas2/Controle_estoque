import { AllocationList } from './AllocationList'
import type { Block } from './types'

export function BlocksList({
  items,
  busy,
  onRelease,
}: {
  items: Block[]
  busy: boolean
  onRelease: (id: string) => void
}) {
  return (
    <AllocationList
      items={items.map((item) => ({
        ...item,
        reference: item.request_id || 'Sem solicitação',
        description: item.reason,
      }))}
      busy={busy}
      type="bloqueio"
      onRelease={onRelease}
    />
  )
}
