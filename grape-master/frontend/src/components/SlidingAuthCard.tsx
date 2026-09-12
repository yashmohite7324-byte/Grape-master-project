'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Grape, Sprout, Store, Leaf, ShoppingBag, ShieldCheck } from 'lucide-react'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'
import type { Role } from '@/lib/types'
import './SlidingAuthCard.css'

const ROLES: { value: Role; label: string; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
  { value: 'FARMER', label: 'Farmer', icon: <Sprout className="h-3.5 w-3.5" />, colorClass: 'hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-800', activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30' },
  { value: 'BROKER', label: 'Broker', icon: <Store className="h-3.5 w-3.5" />, colorClass: 'hover:border-amber-500 hover:bg-amber-50/50 text-amber-800', activeClass: 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/30' },
  { value: 'FERTILIZER_SELLER', label: 'Fertilizer Seller', icon: <Leaf className="h-3.5 w-3.5" />, colorClass: 'hover:border-blue-500 hover:bg-blue-50/50 text-blue-800', activeClass: 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/30' },
  { value: 'CUSTOMER', label: 'Customer', icon: <ShoppingBag className="h-3.5 w-3.5" />, colorClass: 'hover:border-purple-500 hover:bg-purple-50/50 text-purple-800', activeClass: 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/30' },
  { value: 'ADMIN', label: 'System Admin', icon: <ShieldCheck className="h-3.5 w-3.5" />, colorClass: 'hover:border-red-500 hover:bg-red-50/50 text-red-800', activeClass: 'border-red-600 bg-red-50 text-red-950 font-bold ring-2 ring-red-500/30' },
]

export default function SlidingAuthCard({ initialView = 'login' }: { initialView?: 'login' | 'register' }) {
  const { login, register, user, ready, hydrate } = useAuth()
  const router = useRouter()
  const [activeView, setActiveView] = useState<'login' | 'register'>(initialView)

  // Login form state - clean input for MongoDB user authentication
  const [loginRole, setLoginRole] = useState<Role>('FARMER')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register form state
  const [role, setRole] = useState<Role>('FARMER')
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobileNumber: '',
    village: '',
    district: '',
    state: '',
    primaryCrop: '',
    companyName: ''
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) hydrate()
  }, [ready, hydrate])

  useEffect(() => {
    if (ready && user) router.replace(homeForRole(user.role))
  }, [ready, user, router])

  const selectLoginRole = (r: Role) => {
    setLoginRole(r)
    if (r === 'ADMIN') {
      setLoginEmail('admin@grapemaster.com')
      setLoginPassword('Password123')
    }
  }

  const toggleView = () => {
    setActiveView(activeView === 'login' ? 'register' : 'login')
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    const cleanEmail = loginEmail.trim().toLowerCase()
    try {
      const u = await login(cleanEmail, loginPassword)
      router.replace(homeForRole(u.role))
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Invalid login credentials. Please check your registered email & password.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError(null)
    try {
      const u = await register({
        role,
        fullName: regForm.fullName.trim(),
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        mobileNumber: regForm.mobileNumber.trim(),
        village: regForm.village?.trim() || undefined,
        district: regForm.district?.trim() || undefined,
        state: regForm.state?.trim() || undefined,
        primaryCrop: role === 'FARMER' ? regForm.primaryCrop : undefined,
        companyName: (role === 'BROKER' || role === 'FERTILIZER_SELLER') ? regForm.companyName : undefined,
      })
      router.replace(homeForRole(u.role))
    } catch (err) {
      setRegError(err instanceof ApiError ? err.message : 'Failed to create account')
    } finally {
      setRegLoading(false)
    }
  }

  const SocialButtons = () => (
    <div className="auth-sso">
      <button type="button" className="auth-sso-btn" title="Facebook">f</button>
      <button type="button" className="auth-sso-btn" title="Google">G</button>
      <button type="button" className="auth-sso-btn" title="LinkedIn">in</button>
    </div>
  )

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Animated Sliding Background Panel */}
        <div className={`auth-card-bg ${activeView === 'login' ? 'login' : ''}`} />

        {/* Hero Panel for Register view */}
        <div className={`auth-hero register ${activeView === 'register' ? 'active' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <Grape className="h-8 w-8 text-emerald-300 animate-pulse" />
            <span className="font-display text-2xl font-bold">Grape Master</span>
          </div>
          <h2>Already Have an Account?</h2>
          <p>Sign in to manage your harvest listings, broker offers, and fertilizer inventory.</p>
          <button type="button" onClick={toggleView}>
            SIGN IN
          </button>
        </div>

        {/* Register Form */}
        <div className={`auth-form register ${activeView === 'register' ? 'active' : ''}`}>
          <h2 className="font-display text-xl font-bold text-ink">Sign Up (New Account)</h2>
          <SocialButtons />
          <p className="text-xs text-muted">Select your account type</p>

          <div className="grid grid-cols-2 gap-1.5 w-full">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-xs font-medium transition ${
                  role === r.value ? r.activeClass : `border-line text-muted ${r.colorClass}`
                }`}
              >
                {r.icon}
                <span className="truncate">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegisterSubmit} className="w-full space-y-2 mt-1">
            <input
              type="text"
              required
              placeholder="Full Name"
              value={regForm.fullName}
              onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
              className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 chars)"
              value={regForm.password}
              onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
              className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
            />
            <input
              type="text"
              required
              placeholder="Mobile Number"
              value={regForm.mobileNumber}
              onChange={(e) => setRegForm({ ...regForm, mobileNumber: e.target.value })}
              className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Village / City"
                value={regForm.village}
                onChange={(e) => setRegForm({ ...regForm, village: e.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
              />
              <input
                type="text"
                placeholder="District (e.g. Nashik, Pune)"
                value={regForm.district}
                onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                      localStorage.setItem('userLocation', JSON.stringify(coords))
                      setRegForm(f => ({ ...f, village: f.village || 'Detected GPS', district: f.district || 'Nearby Region' }))
                      alert(`📍 Location Captured! Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`)
                    },
                    (err) => alert('Geolocation error: ' + err.message)
                  )
                } else {
                  alert('Geolocation not supported by your browser')
                }
              }}
              className="w-full rounded-lg border border-emerald-300 bg-emerald-50/80 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1"
            >
              📍 Detect My GPS Location
            </button>

            {role === 'FARMER' && (
              <input
                type="text"
                required
                placeholder="Primary Crop (e.g. Grapes, Tomato)"
                value={regForm.primaryCrop}
                onChange={(e) => setRegForm({ ...regForm, primaryCrop: e.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
              />
            )}
            {(role === 'BROKER' || role === 'FERTILIZER_SELLER') && (
              <input
                type="text"
                placeholder="Company / Firm Name"
                value={regForm.companyName}
                onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-vine"
              />
            )}

            {regError && <p className="text-xs text-danger font-medium">{regError}</p>}

            <button
              type="submit"
              disabled={regLoading}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {regLoading ? 'Creating Account...' : `CREATE ${role.replace('_', ' ')} ACCOUNT`}
            </button>
          </form>
        </div>

        {/* Hero Panel for Login view */}
        <div className={`auth-hero login ${activeView === 'login' ? 'active' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <Grape className="h-8 w-8 text-emerald-300 animate-bounce" />
            <span className="font-display text-2xl font-bold">Grape Master</span>
          </div>
          <h2>Welcome Back!</h2>
          <p>Begin your agricultural trading journey with Maharashtra's premier farm-to-dealer network.</p>
          <button type="button" onClick={toggleView}>
            SIGN UP
          </button>
        </div>

        {/* Login Form */}
        <div className={`auth-form login ${activeView === 'login' ? 'active' : ''}`}>
          <h2 className="font-display text-2xl font-bold text-ink">Sign In</h2>
          <SocialButtons />
          <p className="text-xs text-muted">Select your portal role & enter your MongoDB credentials</p>

          {/* 4 Role Selector Buttons */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => selectLoginRole(r.value)}
                className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-xs font-medium transition ${
                  loginRole === r.value ? r.activeClass : `border-line text-muted ${r.colorClass}`
                }`}
              >
                {r.icon}
                <span className="truncate">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLoginSubmit} className="w-full space-y-2.5 mt-1">
            <input
              type="email"
              required
              placeholder="Registered Email address"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-xs text-ink outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-xs text-ink outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold space-y-1.5">
                <p>{loginError}</p>
                {loginError.includes("Click 'SIGN UP'") && (
                  <button
                    type="button"
                    onClick={() => {
                      const clean = loginEmail.trim().toLowerCase()
                      setRegForm(f => ({ ...f, email: clean }))
                      setRole(loginRole === 'ADMIN' ? 'CUSTOMER' : loginRole)
                      setActiveView('register')
                    }}
                    className="w-full mt-1 rounded-lg bg-emerald-700 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
                  >
                    ✨ Click here to create account for {loginEmail.trim().toLowerCase() || 'this email'} now →
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-700 hover:to-teal-800 transition disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : `SIGN IN AS ${loginRole.replace('_', ' ')}`}
            </button>

            {/* Separate Admin Portal Link */}
            <div className="pt-2 text-center border-t border-line">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/admin/login')
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
              >
                <span>🛡️ Executive System Admin Portal Sign-In →</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
