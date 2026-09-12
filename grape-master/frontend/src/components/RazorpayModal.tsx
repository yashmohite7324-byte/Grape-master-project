'use client'

import React, { useState } from 'react'
import { ShieldCheck, CreditCard, QrCode, Building2, CheckCircle2, Lock, Sparkles, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatINR } from '@/lib/format'

interface RazorpayModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number
  orderNumber: string
  onSuccess: () => void
}

export default function RazorpayModal({
  isOpen,
  onClose,
  orderId,
  amount,
  orderNumber,
  onSuccess,
}: RazorpayModalProps) {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upiId, setUpiId] = useState('farmer@upi')

  if (!isOpen) return null

  const handlePay = async () => {
    setProcessing(true)
    setError(null)
    try {
      // Call backend API to simulate/confirm Razorpay payment
      await api.post('/payments/simulate-success', { orderId })
      setSuccess(true)
      setTimeout(() => {
        setProcessing(false)
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setProcessing(false)
      setError(err?.message || 'Could not verify Razorpay payment. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-6 text-white">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-[11px] font-bold text-blue-300 border border-blue-400/30 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Razorpay Test Gateway Active
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Razorpay Secure Pay</h2>
          <p className="text-xs text-blue-200/80 mt-1">Order #{orderNumber} · Total Amount</p>
          <p className="font-mono text-3xl font-extrabold text-amber-300 mt-2">{formatINR(amount)}</p>
        </div>

        {/* Secret Key Badge */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-mono">Secret API Key: <span className="font-bold text-slate-700">CSJbZVXm...NDLipM2NZzZ</span></span>
          <span className="text-emerald-700 font-bold flex items-center gap-1"><Lock className="h-3 w-3" /> SSL 256-bit Encrypted</span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">Payment Verified!</h3>
              <p className="text-xs text-slate-500">Razorpay transaction ID verified. Notifying seller...</p>
            </div>
          ) : (
            <>
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    method === 'UPI'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1 text-blue-600" />
                  <span className="text-xs">UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    method === 'CARD'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-indigo-600" />
                  <span className="text-xs">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('NETBANKING')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    method === 'NETBANKING'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-5 w-5 mb-1 text-purple-600" />
                  <span className="text-xs">NetBanking</span>
                </button>
              </div>

              {method === 'UPI' && (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">Enter UPI ID (Google Pay, PhonePe, Paytm)</p>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@upi"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-500">Supported: GPay, PhonePe, BHIM, Paytm UPI</p>
                </div>
              )}

              {method === 'CARD' && (
                <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <input
                    type="text"
                    placeholder="Card Number (4111 2222 3333 4444)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="MM / YY" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono outline-none" />
                    <input type="password" placeholder="CVV" maxLength={3} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono outline-none" />
                  </div>
                </div>
              )}

              {method === 'NETBANKING' && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">Popular Banks</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <span className="p-2 rounded bg-white border border-slate-200 text-center">SBI Bank</span>
                    <span className="p-2 rounded bg-white border border-slate-200 text-center">HDFC Bank</span>
                    <span className="p-2 rounded bg-white border border-slate-200 text-center">ICICI Bank</span>
                    <span className="p-2 rounded bg-white border border-slate-200 text-center">Axis Bank</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-800 hover:to-indigo-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying Razorpay Payment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span>PAY {formatINR(amount)} VIA RAZORPAY</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
