'use client'
import './globals.css'
import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Theme Context ───────────────────────────────────────────
const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

// ─── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://backend-service:8000'
        const res = await fetch(`${API}/search?q=${query}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function go(symbol: string) {
    setQuery(''); setResults([]); setOpen(false)
    router.push(`/stock/${symbol}`)
  }

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', gap: 24
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14
        }}>S</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>StockSense</span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        {[['/', 'Dashboard'], ['/screener', 'Screener'], ['/watchlist', 'Watchlist']].map(([href, label]) => (
          <Link key={href} href={href} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 14,
            color: 'var(--text-secondary)', textDecoration: 'none',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{label}</Link>
        ))}
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search stock... (e.g. TCS, INFY)"
          style={{
            width: '100%', padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', fontSize: 14, outline: 'none'
          }}
        />
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden', zIndex: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            {results.map(r => (
              <div key={r.symbol} onClick={() => go(r.symbol)}
                style={{
                  padding: '10px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.name}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.sector}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button onClick={toggle} style={{
        marginLeft: 'auto', padding: '8px 16px', borderRadius: 8,
        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </nav>
  )
}

// ─── Root Layout ─────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <html lang="en">
      <head>
        <title>StockSense — AI Stock Analysis</title>
        <meta name="description" content="AI-powered NSE stock analysis with 5-layer scoring" />
      </head>
      <body>
        <ThemeCtx.Provider value={{ theme, toggle }}>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 60px)', padding: '24px' }}>
            {children}
          </main>
          <footer style={{
            borderTop: '1px solid var(--border)', padding: '16px 24px',
            textAlign: 'center', fontSize: 12, color: 'var(--text-muted)'
          }}>
            StockSense © 2025 — For educational purposes only. Not financial advice.
          </footer>
        </ThemeCtx.Provider>
      </body>
    </html>
  )
}
