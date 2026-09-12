'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldCheck, CreditCard, Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card } from '@/components/ui'
import { formatINR } from '@/lib/format'

function PaymentContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { show } = useToast()
  const orderId = params.get('orderId') ?? ''
  const [step, setStep] = useState<'select' | 'processing' | 'done' | 'failed'>('select')
  const [method, setMethod] = useState<'phonepe' | 'demo'>('phonepe')

  const { data: order } = useApi(
    () => orderId ? api.get<any>(`/orders/${orderId}`).then(r => r.data) : Promise.resolve(null), [orderId]
  )

  const initiatePayment = async () => {
    setStep('processing')
    try {
      if (method === 'demo') {
        // Demo simulate — no real gateway needed
        await new Promise(res => setTimeout(res, 2500)) // simulate processing
        await api.post('/payments/simulate-success', { orderId })
        setStep('done')
        show('success', 'Payment successful!')
        setTimeout(() => router.push(`/orders/${orderId}/receipt`), 2000)
      } else {
        // Real PhonePe
        const res = await api.post<{ redirectUrl: string }>('/payments/initiate', { orderId })
        window.location.href = res.data.redirectUrl
      }
    } catch (err) {
      setStep('failed')
      show('error', err instanceof ApiError ? err.message : 'Payment failed')
    }
  }

  if (!orderId) return <div className="flex h-64 items-center justify-center text-muted">No order specified</div>

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-vine-soft">
            <ShieldCheck className="h-7 w-7 text-vine" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Secure Payment</h1>
          <p className="text-sm text-muted">Powered by PhonePe · SSL encrypted</p>
        </div>

        {/* Order summary */}
        {order && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Order Summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Order</span><span className="font-mono text-ink">{order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted">Items</span><span className="font-mono text-ink">{order.orderItems?.length ?? 1}</span></div>
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-mono text-ink">{formatINR(order.subtotal)}</span></div>
              {order.deliveryCharge > 0 && <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="font-mono text-ink">{formatINR(order.deliveryCharge)}</span></div>}
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                <span>Total</span><span className="font-mono text-vine text-base">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </Card>
        )}

        {step === 'select' && (
          <>
            {/* Payment method selection */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Payment method</p>

              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${method === 'phonepe' ? 'border-vine bg-vine-soft' : 'border-line hover:border-vine/50'}`}>
                <input type="radio" name="method" value="phonepe" checked={method === 'phonepe'} onChange={() => setMethod('phonepe')} className="accent-vine" />
                <Smartphone className="h-5 w-5 text-grape" />
                <div>
                  <p className="text-sm font-semibold text-ink">PhonePe</p>
                  <p className="text-xs text-muted">UPI, Cards, Netbanking</p>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.png/200px-PhonePe_Logo.png" alt="PhonePe" className="ml-auto h-6 opacity-80" />
              </label>

              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${method === 'demo' ? 'border-vine bg-vine-soft' : 'border-line hover:border-vine/50'}`}>
                <input type="radio" name="method" value="demo" checked={method === 'demo'} onChange={() => setMethod('demo')} className="accent-vine" />
                <CreditCard className="h-5 w-5 text-vine" />
                <div>
                  <p className="text-sm font-semibold text-ink">Demo payment</p>
                  <p className="text-xs text-muted">Simulate success (development)</p>
                </div>
              </label>
            </Card>

            <Button className="w-full h-12 text-base font-semibold" onClick={initiatePayment}>
              Pay {order ? formatINR(order.totalAmount) : '—'}
            </Button>

            <p className="text-center text-xs text-muted">
              🔒 Your payment details are encrypted and secure. Grape Master never stores card details.
            </p>
          </>
        )}

        {step === 'processing' && (
          <Card className="p-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-vine animate-spin" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">Processing payment…</p>
            <p className="text-sm text-muted mt-1">Please do not close this window</p>
          </Card>
        )}

        {step === 'done' && (
          <Card className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-vine" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">Payment Successful!</p>
            <p className="text-sm text-muted mt-1">Redirecting to your receipt…</p>
          </Card>
        )}

        {step === 'failed' && (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-danger" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">Payment Failed</p>
            <p className="text-sm text-muted mt-2">Your order was not charged. Please try again.</p>
            <Button className="mt-4" onClick={() => setStep('select')}>Try again</Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return <Suspense><PaymentContent /></Suspense>
}
