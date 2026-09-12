'use client'

import React, { useState } from 'react'
import { Truck, CheckCircle2, PackageCheck } from 'lucide-react'
import './OrderButton.css'

interface OrderButtonProps {
  onClick: (e: React.FormEvent) => Promise<void> | void
  label?: string
  loading?: boolean
}

export default function OrderButton({ onClick, label = 'Place Order', loading = false }: OrderButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAnimating || loading || isDone) return

    setIsAnimating(true)

    // Trigger parent click / API call after truck animation starts
    try {
      await onClick(e)
      setTimeout(() => {
        setIsAnimating(false)
        setIsDone(true)
      }, 2500)
    } catch (err) {
      setIsAnimating(false)
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={isAnimating || loading}
      className={`order-btn-wrapper ${isAnimating ? 'animating' : ''} ${isDone ? '!bg-emerald-700' : ''}`}
    >
      <div className="order-btn-content">
        {isDone ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
            <span>Order Placed Successfully!</span>
          </>
        ) : (
          <>
            <PackageCheck className="h-5 w-5" />
            <span>{loading ? 'Processing Order...' : label}</span>
          </>
        )}
      </div>

      <div className="truck-track">
        <div className="box-load" />
        <div className="truck-icon">
          <Truck className="h-7 w-7 text-amber-300 fill-emerald-950" />
        </div>
      </div>
    </button>
  )
}
