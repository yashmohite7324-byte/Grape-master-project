'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Grape, ShieldCheck, CreditCard, CheckCircle2, XCircle, Loader2, ArrowLeft, Smartphone } from 'lucide-react'
import { api } from '@/lib/api'
import { formatINR } from '@/lib/format'
import { Button, Card } from '@/components/ui'

type Step = 'review' | 'processing' | 'success' | 'failed'

const METHOD_OPTIONS = [
  { id: 'UPI', label: 'UPI / PhonePe', icon: <Smartphone className="h-5 w-5" />, desc: 'Pay with any UPI app' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: <CreditCard className="h-5 w-5" />, desc: 'Visa, Mastercard, RuPay' },
  { id: 'NETBANKING', label: 'Net Banking', icon: <ShieldCheck className="h-5 w-5" />, desc: 'All major banks' },
]

function PaymentContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get('orderId') ?? ''

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('review')
  const [method, setMethod] = useState('UPI')
  const [upiId, setUpiId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) { router.replace('/'); return }
    api.get<any>(`/orders/${orderId}`).then(r => {
      setOrder(r.data)
      setLoading(false)
    }).catch(() => { setError('Order not found.'); setLoading(false) })
  }, [orderId, router])

  const handlePay = async () => {
    setStep('processing')
    setError('')
    try {
      // Demo simulate mode — in production this calls PhonePe redirect
      await new Promise(res => setTimeout(res, 2200))
      
      // Call payment initiation
      const res = await api.post<any>(`/payments/initiate`, { orderId, paymentMethod: method })
      
      if (res.data?.success !== false) {
        // Demo checkout deliberately confirms on our API rather than treating
        // initiation as payment success. This creates the transaction and
        // receipt that the next screen displays.
        await api.post(`/payments/simulate-success`, { orderId })
        setStep('success')
        setTimeout(() => router.replace(`/orders/${orderId}/receipt`), 2000)
      }
    } catch {
      setError('We could not confirm this payment. Please try again.')
      setStep('failed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vine" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav */}
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Grape className="h-6 w-6 text-grape" />
            <span className="font-display font-semibold text-ink">Grape Master</span>
          </Link>
          <span className="text-muted">·</span>
          <span className="text-sm text-muted">Secure Checkout</span>
          <ShieldCheck className="ml-auto h-4 w-4 text-green-600" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* ── Review Step ── */}
        {step === 'review' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Link href={`/orders/${orderId}`} className="text-muted hover:text-ink">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="font-display text-2xl font-bold text-ink">Payment</h1>
            </div>

            {/* Order summary */}
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-ink">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Order</span>
                  <span className="font-mono text-ink">{order?.orderNumber ?? orderId.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Items</span>
                  <span>{order?.items?.length ?? 1} item(s)</span>
                </div>
                <div className="my-2 border-t border-line" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono text-lg text-vine">{formatINR(order?.totalAmount ?? 0)}</span>
                </div>
              </div>
            </Card>

            {/* Payment method */}
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-ink">Payment Method</h2>
              <div className="space-y-2">
                {METHOD_OPTIONS.map(m => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${method === m.id ? 'border-vine bg-vine-soft' : 'border-line hover:border-vine/40'}`}>
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="hidden" />
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${method === m.id ? 'bg-vine text-white' : 'bg-paper text-muted'}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{m.label}</p>
                      <p className="text-xs text-muted">{m.desc}</p>
                    </div>
                    {method === m.id && <CheckCircle2 className="ml-auto h-4 w-4 text-vine" />}
                  </label>
                ))}
              </div>

              {method === 'UPI' && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-ink">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@phonepe"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-vine focus:outline-none"
                  />
                </div>
              )}
            </Card>

            {error && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p>}

            <Button onClick={handlePay} className="w-full h-12 text-base font-semibold">
              Pay {formatINR(order?.totalAmount ?? 0)}
            </Button>

            <p className="text-center text-xs text-muted">
              🔒 Secured by PhonePe · Demo mode active
            </p>
          </div>
        )}

        {/* ── Processing ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-vine-soft">
              <Loader2 className="h-10 w-10 animate-spin text-vine" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Processing Payment</h2>
            <p className="mt-2 text-muted">Please wait while we confirm your payment...</p>
            <p className="mt-1 text-xs text-muted">Do not refresh or close this page</p>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Successful!</h2>
            <p className="mt-2 text-muted">Redirecting to your receipt...</p>
            <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-line">
              <div className="h-full animate-pulse bg-vine" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* ── Failed ── */}
        {step === 'failed' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-soft">
              <XCircle className="h-10 w-10 text-danger" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Failed</h2>
            <p className="mt-2 text-muted">Something went wrong. Please try again.</p>
            <Button className="mt-6" onClick={() => setStep('review')}>Try Again</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-vine" /></div>}>
      <PaymentContent />
    </Suspense>
  )
}
