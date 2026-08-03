'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'


function fmt(n: any) {
  if (n == null) return '—'
  if (typeof n === 'number') {
    if (Math.abs(n) >= 1e9) return '₹' + (n / 1e9).toFixed(2) + 'B'
    if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(2) + 'Cr'
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }
  return n
}

function SignalBadge({ signal }: { signal: string }) {
  const cls = signal === 'BUY' ? 'badge-buy' : signal === 'HOLD' ? 'badge-hold' : 'badge-avoid'
  return <span className={cls}>{signal}</span>
}

function RatingBar({ score }: { score: number }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color, minWidth: 36 }}>{score}</span>
    </div>
  )
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 65 ? 'var(--accent-green)' : value >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div style={{ textAlign: 'center', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [signal, setSignal] = useState('ALL')
  const [sector, setSector] = useState('ALL')
  const [sortBy, setSortBy] = useState('confidence')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [minRating, setMinRating] = useState(0)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/screener`)
      .then(r => r.json())
      .then(data => {
        setStocks(data.stocks || [])
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sectors = ['ALL', ...Array.from(new Set(stocks.map(s => s.sector).filter(Boolean)))]

  const filtered = stocks
    .filter(s => signal === 'ALL' || s.signal === signal)
    .filter(s => sector === 'ALL' || s.sector === sector)
    .filter(s => s.confidence >= minRating)
    .filter(s => search === '' || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = sortBy === 'confidence' ? a.confidence
        : sortBy === 'fundamental' ? a.scores.fundamental
        : sortBy === 'technical' ? a.scores.technical
        : sortBy === 'sentiment' ? a.scores.sentiment
        : sortBy === 'risk' ? a.scores.risk
        : sortBy === 'price' ? (a.price || 0)
        : sortBy === 'change' ? (a.change_pct || 0)
        : a.confidence
      const vb = sortBy === 'confidence' ? b.confidence
        : sortBy === 'fundamental' ? b.scores.fundamental
        : sortBy === 'technical' ? b.scores.technical
        : sortBy === 'sentiment' ? b.scores.sentiment
        : sortBy === 'risk' ? b.scores.risk
        : sortBy === 'price' ? (b.price || 0)
        : sortBy === 'change' ? (b.change_pct || 0)
        : b.confidence
      return sortDir === 'desc' ? vb - va : va - vb
    })

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  function SortTh({ col, label }: { col: string; label: string }) {
    const active = sortBy === col
    return (
      <th onClick={() => toggleSort(col)} style={{
        padding: '12px 14px', textAlign: 'left', fontWeight: 600,
        color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
        cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
        fontSize: 12
      }}>
        {label} {active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
      </th>
    )
  }

  const buyCount  = stocks.filter(s => s.signal === 'BUY').length
  const holdCount = stocks.filter(s => s.signal === 'HOLD').length
  const avoidCount = stocks.filter(s => s.signal === 'AVOID').length
  const avgRating = stocks.length ? Math.round(stocks.reduce((a, s) => a + s.confidence, 0) / stocks.length) : 0

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Stock Screener</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
              AI-powered 5-layer analysis on {stocks.length} NSE stocks
              {lastUpdated && <span> · Updated {lastUpdated}</span>}
            </p>
          </div>
          <button onClick={() => { setLoading(true); fetch(`${API}/screener`).then(r => r.json()).then(d => { setStocks(d.stocks || []); setLastUpdated(new Date().toLocaleTimeString('en-IN')) }).finally(() => setLoading(false)) }}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Stocks" value={stocks.length} />
        <StatCard label="BUY Signals" value={buyCount} color="var(--accent-green)" />
        <StatCard label="HOLD Signals" value={holdCount} color="var(--accent-yellow)" />
        <StatCard label="AVOID Signals" value={avoidCount} color="var(--accent-red)" />
        <StatCard label="Avg AI Rating" value={`${avgRating}/100`} color="var(--accent-blue)" />
        <StatCard label="Showing" value={filtered.length} />
      </div>

      {/* Signal Distribution Bar */}
      {stocks.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Signal Distribution</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
            <div style={{ flex: buyCount, background: 'var(--accent-green)', borderRadius: '99px 0 0 99px' }} title={`BUY: ${buyCount}`} />
            <div style={{ flex: holdCount, background: 'var(--accent-yellow)' }} title={`HOLD: ${holdCount}`} />
            <div style={{ flex: avoidCount, background: 'var(--accent-red)', borderRadius: '0 99px 99px 0' }} title={`AVOID: ${avoidCount}`} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-green)' }}>● BUY {buyCount}</span>
            <span style={{ color: 'var(--accent-yellow)' }}>● HOLD {holdCount}</span>
            <span style={{ color: 'var(--accent-red)' }}>● AVOID {avoidCount}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or symbol..."
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, minWidth: 200 }}
        />

        {/* Signal Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL','BUY','HOLD','AVOID'].map(f => (
            <button key={f} onClick={() => setSignal(f)} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: signal === f
                ? f === 'BUY' ? 'var(--accent-green)' : f === 'HOLD' ? 'var(--accent-yellow)' : f === 'AVOID' ? 'var(--accent-red)' : 'var(--accent-blue)'
                : 'var(--bg-secondary)',
              color: signal === f ? '#fff' : 'var(--text-primary)',
              fontWeight: signal === f ? 600 : 400
            }}>{f}</button>
          ))}
        </div>

        {/* Sector Filter */}
        <select value={sector} onChange={e => setSector(e.target.value)} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer'
        }}>
          {sectors.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sectors' : s}</option>)}
        </select>

        {/* Min Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Min Rating:</span>
          <input type="range" min={0} max={80} step={5} value={minRating} onChange={e => setMinRating(Number(e.target.value))}
            style={{ width: 100 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 28 }}>{minRating}</span>
        </div>

        {/* Reset */}
        <button onClick={() => { setSignal('ALL'); setSector('ALL'); setMinRating(0); setSearch('') }}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
          Reset filters
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>#</th>
                <SortTh col="name" label="Stock" />
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Sector</th>
                <SortTh col="price" label="Price" />
                <SortTh col="change" label="Change" />
                <SortTh col="confidence" label="Rating (0–100)" />
                <SortTh col="fundamental" label="Fund." />
                <SortTh col="technical" label="Tech." />
                <SortTh col="sentiment" label="Sent." />
                <SortTh col="risk" label="Risk" />
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Signal</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}><td colSpan={12} style={{ padding: 12 }}>
                  <div className="shimmer" style={{ height: 14, width: `${60 + Math.random()*30}%` }} />
                </td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No stocks match your filters. Try adjusting them.
                </td></tr>
              ) : filtered.map((s, idx) => {
                const up = s.change_pct >= 0
                const isExpanded = expanded === s.symbol
                return (
                  <>
                    <tr key={s.symbol}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setExpanded(isExpanded ? null : s.symbol)}>
                      <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.symbol.replace('.NS','')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.name}</div>
                      </td>
                      <td style={{ padding: '14px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>{s.sector}</td>
                      <td style={{ padding: '14px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(s.price)}</td>
                      <td style={{ padding: '14px 14px', fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {up ? '+' : ''}{s.change_pct?.toFixed(2)}%
                      </td>
                      <td style={{ padding: '14px 14px', minWidth: 180 }}>
                        <RatingBar score={s.confidence} />
                      </td>
                      <td style={{ padding: '14px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.scores.fundamental}</td>
                      <td style={{ padding: '14px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.scores.technical}</td>
                      <td style={{ padding: '14px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.scores.sentiment}</td>
                      <td style={{ padding: '14px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.scores.risk}</td>
                      <td style={{ padding: '14px 14px' }}><SignalBadge signal={s.signal} /></td>
                      <td style={{ padding: '14px 14px' }}>
                        <Link href={`/stock/${s.symbol}`}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--accent-blue)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${s.symbol}-expanded`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <td colSpan={12} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginRight: 8 }}>5-Layer Breakdown:</span>
                            <ScorePill label="Fundamental" value={s.scores.fundamental} />
                            <ScorePill label="Technical" value={s.scores.technical} />
                            <ScorePill label="Sentiment" value={s.scores.sentiment} />
                            <ScorePill label="Risk" value={s.scores.risk} />
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                              <Link href={`/stock/${s.symbol}`} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                                Full Analysis →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Click any row to expand score breakdown · Showing {filtered.length} of {stocks.length} stocks · For educational purposes only
      </div>
    </div>
  )
}