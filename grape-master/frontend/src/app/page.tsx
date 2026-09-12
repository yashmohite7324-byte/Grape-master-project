import Link from 'next/link'
import Image from 'next/image'
import { Grape, ArrowRight, Sprout, Store, Leaf, ShoppingBag, CheckCircle, Star, Shield } from 'lucide-react'
import { HERO_IMAGE, FARM_HERO, MARKET_HERO, FERTILIZER_HERO } from '@/lib/images'

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Grape className="h-7 w-7 text-white" />
            <span className="font-display text-xl font-semibold text-white">Grape Master</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin/login" className="rounded-lg bg-red-600/90 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-600 border border-red-400/40 shadow-sm flex items-center gap-1.5 transition-all">
              <Shield className="h-4 w-4" /> Admin Control
            </Link>
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
              Sign in
            </Link>
            <Link href="/register" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-vine-deep hover:bg-white/90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[620px] overflow-hidden">
        <img src={HERO_IMAGE} alt="Grape vineyard" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-vine-deep/80 via-vine/60 to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-start justify-center px-6 pb-20 pt-24 max-w-7xl mx-auto">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            🍇 Agricultural Marketplace — Maharashtra & Beyond
          </span>
          <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight text-white md:text-6xl">
            From farm to market,<br />
            <span className="text-yellow-300">open and fair.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Farmers list produce. Brokers discover and bid. Fertilizer sellers reach farmers directly.
            AI recommends the right inputs at the right time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register?role=FARMER" className="gradient-vine inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90">
              <Sprout className="h-4 w-4" /> I&apos;m a Farmer
            </Link>
            <Link href="/register?role=BROKER" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-vine-deep shadow-lg hover:bg-white/90">
              <Store className="h-4 w-4" /> I&apos;m a Broker
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {[
            ['5,000+', 'Registered Farmers'],
            ['450+', 'Active Brokers'],
            ['120+', 'Fertilizer Sellers'],
            ['₹2.4 Cr+', 'Transactions Processed'],
          ].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center justify-center px-6 py-5">
              <span className="font-display text-2xl font-bold text-yellow-300">{val}</span>
              <span className="mt-0.5 text-xs text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Role cards */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-vine">Who uses Grape Master</span>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink">Built for every role in agriculture</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <RoleCard role="FARMER" title="Farmer" icon={<Sprout />}
            desc="List your harvest, receive broker offers, and buy inputs with AI-powered recommendations."
            img={FARM_HERO} color="vine" />
          <RoleCard role="BROKER" title="Broker" icon={<Store />}
            desc="Browse listings, make competitive offers, and manage your produce inventory."
            img={MARKET_HERO} color="grape" />
          <RoleCard role="FERTILIZER_SELLER" title="Input Seller" icon={<Leaf />}
            desc="List fertilizers and agricultural inputs. Reach farmers who need your products."
            img={FERTILIZER_HERO} color="harvest" />
          <RoleCard role="CUSTOMER" title="Customer" icon={<ShoppingBag />}
            desc="Buy fresh produce directly from broker inventory with quality assurance."
            img="/images/produce.jpg" color="ink" />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-vine-soft py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold text-ink">How a trade happens</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              ['01', 'Farmer lists', 'Post crop details, quantity, and asking price in under 2 minutes.', '/images/hero.jpg'],
              ['02', 'Broker bids', 'Brokers compete with transparent offers. No back-channel negotiation.', '/images/broker_hero.jpg'],
              ['03', 'Deal confirmed', 'Farmer accepts. Produce moves to broker inventory instantly.', '/images/produce.jpg'],
              ['04', 'Payment & receipt', 'PhonePe payment. Automatic transaction record and PDF receipt.', '/images/fertilizer_hero.jpg'],
            ].map(([n, title, body, img]) => (
              <div key={n} className="rounded-card overflow-hidden bg-white shadow-card">
                <div className="h-36 overflow-hidden">
                  <img src={img} alt={title as string} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <span className="font-mono text-sm text-grape">{n}</span>
                  <h3 className="mt-1 font-display text-base font-semibold text-ink">{title as string}</h3>
                  <p className="mt-1 text-xs text-muted">{body as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ML Feature */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-2xl bg-ink text-white">
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-vine px-3 py-1 text-xs font-semibold text-white">
                ✨ AI-Powered
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold">
                Smart recommendations<br />for your farm
              </h2>
              <p className="mt-4 text-white/70">
                Our ML engine analyses your crop, location, past purchases, and weather to suggest
                exactly the right fertilizers and inputs — ranked by relevance to your farm.
              </p>
              <ul className="mt-6 space-y-2">
                {['Crop-specific nutrient suggestions', 'Weather-aware recommendations', 'Learns from your purchase history', 'Nearby seller prioritization'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-vine shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-64 overflow-hidden md:h-auto">
              <img src="/images/produce.jpg" alt="ML recommendations" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-paper py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-ink">Trusted by farmers across Maharashtra</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Ravi Patil', role: 'Grape Farmer, Nashik', text: 'Got 3 broker offers within an hour of listing. Accepted the best price and the whole process was transparent.' },
              { name: 'Suresh Jadhav', role: 'Broker, Pune', text: 'The marketplace shows me fresh listings every day. I can filter by crop and location exactly like I need.' },
              { name: 'Meena Kulkarni', role: 'Input Seller, Nashik', text: 'My fertilizer orders from farmers doubled after listing on Grape Master. The inventory tracking is excellent.' },
            ].map(t => (
              <div key={t.name} className="rounded-card border border-line bg-white p-6 shadow-card">
                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-muted">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-vine-soft text-vine font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-vine py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-white">Ready to grow smarter?</h2>
          <p className="mt-3 text-white/80">Join thousands of farmers and brokers on India's most transparent agricultural marketplace.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-vine-deep hover:bg-white/90">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3 text-sm font-medium text-white hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-ink px-6 py-10 text-center text-sm text-white/40">
        Grape Master © 2026 · Agricultural Marketplace · Built with ❤️ for Indian farmers
      </footer>
    </div>
  )
}

function RoleCard({ role, title, icon, desc, img, color }: {
  role: string; title: string; icon: React.ReactNode
  desc: string; img: string; color: string
}) {
  const colorMap: Record<string, string> = {
    vine: 'bg-vine-soft text-vine', grape: 'bg-grape-soft text-grape',
    harvest: 'bg-harvest-soft text-harvest', ink: 'bg-ink/10 text-ink'
  }
  return (
    <Link href={`/register?role=${role}`}>
      <div className="group overflow-hidden rounded-card border border-line bg-white shadow-card card-hover">
        <div className="h-40 overflow-hidden">
          <img src={img} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div className="p-5">
          <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${colorMap[color]}`}>
            {icon}{title}
          </div>
          <p className="text-sm text-muted">{desc}</p>
          <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-vine">
            Get started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </p>
        </div>
      </div>
    </Link>
  )
}
