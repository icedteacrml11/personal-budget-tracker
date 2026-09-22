import { useState } from 'react'
import { BudgetProvider, P } from './store'
import { HomeView } from './views/HomeView'
import { WalletView } from './views/WalletView'
import { ExpensesView } from './views/ExpensesView'
import { PeopleView } from './views/PeopleView'

type TabId = 'home' | 'wallet' | 'expenses' | 'people'

const tabs: { id: TabId; label: string; icon: (active: boolean) => React.JSX.Element }[] = [
  {
    id: 'home', label: 'Home',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? P.blue.solid : P.secondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 14 15 14 15 21" />
      </svg>
    ),
  },
  {
    id: 'wallet', label: 'Wallet',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? P.blue.solid : P.secondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="15" rx="2" />
        <path d="M16 12h2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: 'expenses', label: 'Expenses',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? P.blue.solid : P.secondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'people', label: 'People',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? P.blue.solid : P.secondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

/* ── Avatar ─────────────────────────────────────────────────── */

function Avatar({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 2,
        background: 'linear-gradient(135deg, #0A6CFF, #3E93FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 600, fontSize: size * 0.36,
        boxShadow: '0 2px 12px rgba(10,108,255,0.3)',
        flexShrink: 0,
      }}
    >
      TB
    </div>
  )
}

/* ── App Shell ──────────────────────────────────────────────── */

function AppShell() {
  const [tab, setTab] = useState<TabId>('home')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: P.bg }}>
      {/* ── Desktop sidebar (md+) ──────────────────────────── */}
      <aside
        className="hidden md:flex"
        style={{
          width: 224, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
          flexDirection: 'column',
          background: 'rgba(244,244,246,0.82)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: `1px solid ${P.hair}`,
          padding: '32px 16px 24px',
          zIndex: 40,
        }}
      >
        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 8 }}>
          <Avatar size={40} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: P.ink, lineHeight: 1.3 }}>Taylor Brooks</div>
            <div style={{ fontSize: 12, color: P.tertiary }}>Personal budget</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: P.hair, margin: '16px 8px' }} />

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: active ? 'rgba(10,108,255,0.09)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: active ? P.blue.solid : P.secondary,
                  fontWeight: active ? 600 : 400,
                  fontSize: 14, fontFamily: 'inherit',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget.style.background = 'rgba(0,0,0,0.03)') }}
                onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent') }}
              >
                {t.icon(active)}
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ fontSize: 11, color: P.tertiary, padding: '0 12px', letterSpacing: '0.02em' }}>
          Budget Tracker
        </div>
      </aside>

      {/* ── Mobile top bar (<md) ───────────────────────────── */}
      <header
        className="flex md:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(244,244,246,0.82)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: `1px solid ${P.hair}`,
          padding: '12px 16px 0',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar size={32} />
          <div style={{ fontWeight: 600, fontSize: 15, color: P.ink }}>Taylor Brooks</div>
        </div>
        <nav style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '8px 0 10px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  color: active ? P.blue.solid : P.secondary,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13, fontFamily: 'inherit',
                  borderBottom: active ? `2px solid ${P.blue.solid}` : '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: 768,
          margin: '0 auto',
          padding: '40px 24px 60px',
        }}
        className="pt-28 md:pt-10 px-6 md:px-10"
      >
        {tab === 'home' && <HomeView />}
        {tab === 'wallet' && <WalletView />}
        {tab === 'expenses' && <ExpensesView />}
        {tab === 'people' && <PeopleView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BudgetProvider>
      <AppShell />
    </BudgetProvider>
  )
}
