'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/components/Toast'
import { api, ApiError } from '@/lib/api'
import { Button, Card, Field, Input, Select, EmptyState } from '@/components/ui'
import { formatINR } from '@/lib/format'
import OrderButton from '@/components/OrderButton'

const DELIVERY_BASE = 30
const DELIVERY_PER_KM = 8
const MOCK_DISTANCE = 10

export default function CartPage() {
  const { items, remove, update, clear } = useCart()
  const { show } = useToast()
  const router = useRouter()
  const [checkout, setCheckout] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [fulfillment, setFulfillment] = useState<'PICKUP' | 'DELIVERY'>('DELIVERY')
  const [address, setAddress] = useState({
    fullName: '',
    mobileNumber: '',
    addressLine: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
  })

  const setAddr = (k: keyof typeof address) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setAddress(a => ({ ...a, [k]: e.target.value }))

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const deliveryCharge = fulfillment === 'DELIVERY' ? DELIVERY_BASE + MOCK_DISTANCE * DELIVERY_PER_KM : 0
  const total = subtotal + deliveryCharge

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setPlacing(true)
    try {
      const order = await api.post<{ id: string; orderNumber: string }>('/orders', {
        sellerId: items[0].sellerId,
        orderType: 'FERTILIZER',
        fulfillmentMethod: fulfillment,
        guestPhone: address.mobileNumber || '9876543210',
        guestName: address.fullName || 'Guest Customer',
        shippingAddress: {
          fullName: address.fullName || 'Customer',
          mobileNumber: address.mobileNumber || '9876543210',
          addressLine: address.addressLine || 'Address details',
          village: address.village || 'Village',
          district: address.district || 'District',
          state: address.state || 'Maharashtra',
          pincode: address.pincode || '411001',
        },
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
      })
      show('success', `Order ${order.data.orderNumber} placed!`)
      clear()
      setTimeout(() => {
        router.push('/customer/orders')
      }, 1500)
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Could not place order')
      throw err
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Cart</h1>
        <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="Your cart is empty"
          action={<Link href="/customer"><Button>Browse products</Button></Link>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Cart</h1>

      <Card className="mb-4 divide-y divide-line">
        {items.map(item => (
          <div key={item.product.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-ink">{item.product.name}</p>
              <p className="text-sm text-muted">{formatINR(item.product.price)} / {item.product.unit}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="number" min="1" value={item.quantity}
                onChange={e => update(item.product.id, Number(e.target.value))}
                className="w-16 rounded border border-line px-2 py-1 text-center font-mono text-sm focus:border-vine focus:outline-none" />
              <span className="w-20 text-right font-mono text-sm tabular-nums text-ink">
                {formatINR(item.product.price * item.quantity)}
              </span>
              <button onClick={() => remove(item.product.id)} className="text-muted hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      {!checkout ? (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Delivery (est.)" value={fulfillment === 'DELIVERY' ? formatINR(deliveryCharge) : 'Free (pickup)'} />
              <Row label="Total" value={formatINR(total)} bold />
            </div>
          </Card>
          <Button className="w-full font-bold shadow-md py-3 text-base" onClick={() => setCheckout(true)}>Proceed to Checkout</Button>
        </div>
      ) : (
        <form onSubmit={placeOrder} className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 font-display text-lg text-ink">Delivery details</h2>
            <Field label="Fulfillment">
              <Select value={fulfillment} onChange={e => setFulfillment(e.target.value as 'PICKUP' | 'DELIVERY')}>
                <option value="DELIVERY">Home delivery</option>
                <option value="PICKUP">Self pickup</option>
              </Select>
            </Field>
            {fulfillment === 'DELIVERY' && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><Input required value={address.fullName} onChange={setAddr('fullName')} placeholder="e.g. Sumit Khetre" /></Field>
                  <Field label="Mobile"><Input required value={address.mobileNumber} onChange={setAddr('mobileNumber')} placeholder="e.g. 9632587410" /></Field>
                </div>
                <Field label="Address"><Input required value={address.addressLine} onChange={setAddr('addressLine')} placeholder="Taluka Mulshi District Pune" /></Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Village"><Input required value={address.village} onChange={setAddr('village')} placeholder="Mulshi" /></Field>
                  <Field label="District"><Input required value={address.district} onChange={setAddr('district')} placeholder="Pune" /></Field>
                  <Field label="State"><Input required value={address.state} onChange={setAddr('state')} placeholder="Maharashtra" /></Field>
                </div>
                <Field label="PIN code"><Input required value={address.pincode} onChange={setAddr('pincode')} placeholder="413512" /></Field>
              </div>
            )}
          </Card>

          <Card className="p-4 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {fulfillment === 'DELIVERY' && <Row label="Delivery charge" value={formatINR(deliveryCharge)} />}
            <Row label="Total payable" value={formatINR(total)} bold />
          </Card>

          <div className="flex gap-3">
            <div className="flex-1">
              <OrderButton onClick={placeOrder} label={`Place Order · ${formatINR(total)}`} loading={placing} />
            </div>
            <Button type="button" variant="secondary" onClick={() => setCheckout(false)}>Back</Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${bold ? 'font-semibold text-ink' : 'text-muted'}`}>{value}</span>
    </div>
  )
}
