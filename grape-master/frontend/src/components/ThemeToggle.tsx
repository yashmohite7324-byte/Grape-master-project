'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('appTheme') as 'light' | 'dark'
    if (saved) {
      setTheme(saved)
      if (saved === 'dark') document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('appTheme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:opacity-80"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4 text-purple-600" /> Dark Mode
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-amber-500" /> Light Mode
        </>
      )}
    </button>
  )
}
