import { AllocationList } from './AllocationList'
import type { Reservation } from './types'

export function ReservationsList({
  items,
  busy,
  onRelease,
}: {
  items: Reservation[]
  busy: boolean
  onRelease: (id: string) => void
}) {
  return (
    <AllocationList
      items={items.map((item) => ({ ...item, reference: item.request_id }))}
      busy={busy}
      type="reserva"
      onRelease={onRelease}
    />
  )
}
