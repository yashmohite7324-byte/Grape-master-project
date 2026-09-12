'use client'

import React, { Suspense } from 'react'
import SlidingAuthCard from '@/components/SlidingAuthCard'

export default function LoginPage() {
  return (
    <Suspense>
      <SlidingAuthCard initialView="login" />
    </Suspense>
  )
}
