'use client'

import React, { useState } from 'react'
import { ShieldCheck, CreditCard, QrCode, Building2, CheckCircle2, Lock, Sparkles, X, ArrowRight, Check } from 'lucide-react'
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

const BANKS = [
  { id: 'SBI', name: 'State Bank of India', icon: '🏛️' },
  { id: 'HDFC', name: 'HDFC Bank', icon: '🏦' },
  { id: 'ICICI', name: 'ICICI Bank', icon: '💳' },
  { id: 'AXIS', name: 'Axis Bank', icon: '🏛️' },
  { id: 'KOTAK', name: 'Kotak Mahindra', icon: '🏦' },
  { id: 'PNB', name: 'Punjab National Bank', icon: '🏛️' },
]

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '🔵' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', icon: '🔷' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳' },
]

export default function RazorpayModal({
  isOpen,
  onClose,
  orderId,
  amount,
  orderNumber,
  onSuccess,
}: RazorpayModalProps) {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI')
  const [selectedBank, setSelectedBank] = useState('SBI')
  const [selectedUpiApp, setSelectedUpiApp] = useState('phonepe')
  const [upiId, setUpiId] = useState('farmer@upi')
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1234')
  const [cardHolder, setCardHolder] = useState('Grape Master User')

  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txnId, setTxnId] = useState('')

  if (!isOpen) return null

  const handlePay = async () => {
    setProcessing(true)
    setError(null)
    const generatedTxn = `pay_rzp_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    setTxnId(generatedTxn)

    try {
      await api.post('/payments/simulate-success', {
        orderId,
        paymentGateway: 'RAZORPAY',
        transactionId: generatedTxn,
      })
      setSuccess(true)
      setProcessing(false)
    } catch (err: any) {
      setProcessing(false)
      setError(err?.message || 'Could not verify Razorpay payment. Please try again.')
    }
  }

  const handleFinish = () => {
    setSuccess(false)
    onSuccess()
  }

  const getPaymentSummary = () => {
    if (method === 'NETBANKING') {
      const b = BANKS.find(x => x.id === selectedBank)
      return b ? `${b.name} NetBanking` : 'NetBanking'
    }
    if (method === 'UPI') {
      const u = UPI_APPS.find(x => x.id === selectedUpiApp)
      return `${u?.name || 'UPI'} (${upiId})`
    }
    return `Credit/Debit Card ending in ${cardNumber.slice(-4)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-6 text-white relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-bold text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Razorpay Test Gateway Active
            </span>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">Razorpay Secure Checkout</h2>
          <p className="text-xs text-blue-200/90 mt-1">Order #{orderNumber} · Amount Payable</p>
          <p className="font-mono text-3xl font-black text-amber-300 mt-1">{formatINR(amount)}</p>
        </div>

        {/* Secret Key Badge */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-mono">Test Key Secret: <span className="font-bold text-slate-800">CSJbZVXm...NDLipM2NZzZ</span></span>
          <span className="text-emerald-700 font-bold flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> 256-bit Encrypted</span>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {success ? (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  Payment Successful
                </span>
                <h3 className="font-display text-2xl font-bold text-slate-900">Transaction Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1">Your order has been paid and confirmed with the seller.</p>
              </div>

              {/* Receipt Summary Card */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900">{txnId}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Payment Method</span>
                  <span className="font-semibold text-slate-800">{getPaymentSummary()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Order Number</span>
                  <span className="font-mono font-bold text-blue-700">#{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-sm">
                  <span className="text-slate-700">Amount Paid</span>
                  <span className="font-mono text-emerald-700 text-base">{formatINR(amount)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                <span>View & Track Order</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Select Payment Method Tabs */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('UPI')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      method === 'UPI'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="h-6 w-6 mb-1.5 text-blue-600" />
                    <span className="text-xs font-medium">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('NETBANKING')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      method === 'NETBANKING'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="h-6 w-6 mb-1.5 text-purple-600" />
                    <span className="text-xs font-medium">NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('CARD')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      method === 'CARD'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mb-1.5 text-indigo-600" />
                    <span className="text-xs font-medium">Card</span>
                  </button>
                </div>
              </div>

              {/* UPI Option */}
              {method === 'UPI' && (
                <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Popular UPI Apps</p>
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
                            selectedUpiApp === app.id
                              ? 'border-blue-600 bg-white text-blue-900 font-bold shadow-sm ring-1 ring-blue-500/30'
                              : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{app.icon}</span>
                            <span>{app.name}</span>
                          </span>
                          {selectedUpiApp === app.id && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Enter UPI VPA / ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              {/* NetBanking Option with Bank Selection */}
              {method === 'NETBANKING' && (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-xs font-bold text-slate-800">Select Bank for NetBanking</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition ${
                          selectedBank === bank.id
                            ? 'border-blue-600 bg-white text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{bank.icon}</span>
                          <span className="leading-tight">{bank.name}</span>
                        </span>
                        {selectedBank === bank.id && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Option */}
              {method === 'CARD' && (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Expiry Date</label>
                      <input type="text" placeholder="12 / 28" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">CVV / CVC</label>
                      <input type="password" placeholder="•••" maxLength={3} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Submit Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 py-3.5 text-sm font-extrabold text-white shadow-xl hover:from-blue-800 hover:to-indigo-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing Razorpay Payment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>PAY {formatINR(amount)} VIA RAZORPAY</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
