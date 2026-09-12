import type { OfferStatus, ListingStatus, OrderStatus, PaymentStatus } from './types'

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

export const formatQty = (n: number, unit: string) =>
  `${new Intl.NumberFormat('en-IN').format(n)}${unit ? ' ' + unit : ''}`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

type StatusKey = OfferStatus | ListingStatus | OrderStatus | PaymentStatus
export const statusStyle: Record<string, string> = {
  ACTIVE:            'bg-vine-soft text-vine-deep',
  SOLD:              'bg-grape-soft text-grape',
  EXPIRED:           'bg-line text-muted',
  CANCELLED:         'bg-line text-muted',
  FAILED:            'bg-danger-soft text-danger',
  PENDING:           'bg-harvest-soft text-harvest',
  PENDING_PAYMENT:   'bg-harvest-soft text-harvest',
  ACCEPTED:          'bg-vine-soft text-vine-deep',
  REJECTED:          'bg-danger-soft text-danger',
  PAID:              'bg-vine-soft text-vine-deep',
  CONFIRMED:         'bg-vine-soft text-vine-deep',
  PROCESSING:        'bg-harvest-soft text-harvest',
  READY_FOR_PICKUP:  'bg-grape-soft text-grape',
  OUT_FOR_DELIVERY:  'bg-grape-soft text-grape',
  DELIVERED:         'bg-vine-soft text-vine-deep',
  COMPLETED:         'bg-vine-soft text-vine-deep',
  SUCCESS:           'bg-vine-soft text-vine-deep',
  REFUNDED:          'bg-grape-soft text-grape',
}
