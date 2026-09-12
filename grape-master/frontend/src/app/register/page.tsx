'use client'

import React, { Suspense } from 'react'
import SlidingAuthCard from '@/components/SlidingAuthCard'

export default function RegisterPage() {
  return (
    <Suspense>
      <SlidingAuthCard initialView="register" />
    </Suspense>
  )
}
