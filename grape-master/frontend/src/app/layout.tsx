import type { Metadata } from 'next'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeToggle'
import LocationModal from '@/components/LocationModal'
import { LocationProvider } from '@/components/LocationContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Grape Master | Agricultural Marketplace',
  description: 'Farm-to-market trading platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${mono.variable}`}>
      <body className="font-sans bg-paper text-ink selection:bg-vine/20 selection:text-vine-deep antialiased transition-colors duration-300">
        <ThemeProvider>
          <LocationProvider>
            <ToastProvider>
              {children}
              <LocationModal />
            </ToastProvider>
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
