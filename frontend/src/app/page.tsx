'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

function fmt(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function SignalBadge({ signal }: { signal: string }) {
  const cls = signal === 'BUY' ? 'badge-buy' : signal === 'HOLD' ? 'badge-hold' : 'badge-avoid'
  return <span className={cls}>{signal}</span>
}

function RatingBar({ score }: { score: number }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rating</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/100</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function RatingGauge({ score }: { score: number }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  const label = score >= 65 ? 'BUY' : score >= 42 ? 'HOLD' : 'AVOID'
  const angle = (score / 100) * 180 - 90
  const r = 54, cx = 70, cy = 70
  const toRad = (d: number) => (d * Math.PI) / 180
  const x = cx + r * Math.cos(toRad(angle - 90))
  const y = cy + r * Math.sin(toRad(angle - 90))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="140" height="80" viewBox="0 0 140 90">
        <path d="M 16 70 A 54 54 0 0 1 124 70" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
        <path d={`M 16 70 A 54 54 0 0 1 ${x} ${y}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
        <text x="70" y="62" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{score}</text>
        <text x="70" y="78" textAnchor="middle" fontSize="11" fill="var(--text-muted)">out of 100</text>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color, marginTop: -4 }}>{label}</span>
    </div>
  )
}

// ─── Market Ticker ────────────────────────────────────────
function MarketTicker({ indices }: { indices: any[] }) {
  const items = [...indices, ...indices]
  return (
    <div style={{ overflow: 'hidden', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
      <div className="ticker-track">
        {items.map((idx, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{idx.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(idx.price)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: idx.change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {idx.change_pct >= 0 ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}%
            </span>
            <span style={{ color: 'var(--border)', marginLeft: 8 }}>|</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Index Card ───────────────────────────────────────────
function IndexCard({ idx }: { idx: any }) {
  const up = idx.change_pct >= 0
  return (
    <div className="card" style={{ padding: '16px 20px', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{idx.name}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(idx.price)}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: 2 }}>
        {up ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}%
      </div>
    </div>
  )
}

// ─── Stock Card ───────────────────────────────────────────
function StockCard({ stock }: { stock: any }) {
  const up = stock.change_pct >= 0
  return (
    <Link href={`/stock/${stock.symbol}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{stock.symbol.replace('.NS', '')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{stock.name}</div>
          </div>
          <SignalBadge signal={stock.signal} />
        </div>
        <RatingGauge score={stock.confidence} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Price</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(stock.price)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Change</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {up ? '+' : ''}{stock.change_pct?.toFixed(2)}%
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <RatingBar score={stock.confidence} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {Object.entries(stock.scores).map(([k, v]: any) => (
            <div key={k} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 99 }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}: <b style={{ color: 'var(--text-primary)' }}>{v}</b>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      {[80, 120, 60, 40, 100].map((w, i) => (
        <div key={i} className="shimmer" style={{ height: 14, width: w, marginBottom: 12 }} />
      ))}
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────
export default function HomePage() {
  const [indices, setIndices] = useState<any[]>([])
  const [topBuys, setTopBuys] = useState<any[]>([])
  const [allStocks, setAllStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [mkt, scr] = await Promise.all([
          fetch(`${API}/market-overview`).then(r => r.json()),
          fetch(`${API}/screener`).then(r => r.json())
        ])
        setIndices(mkt.indices || [])
        const stocks = scr.stocks || []
        setAllStocks(stocks)
        setTopBuys(stocks.filter((s: any) => s.signal === 'BUY').slice(0, 6))
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'ALL' ? allStocks : allStocks.filter(s => s.signal === filter)

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Ticker */}
      {indices.length > 0 && <div style={{ margin: '-24px -24px 24px' }}><MarketTicker indices={indices} /></div>}

      {/* Market Overview */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Market Overview</h2>
          {lastUpdated && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated {lastUpdated}</span>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {loading ? [1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 90, flex: 1, minWidth: 160, borderRadius: 12 }} />)
            : indices.map(idx => <IndexCard key={idx.symbol} idx={idx} />)}
        </div>
      </section>

      {/* Top BUY Picks Today */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Today's Top BUY Picks</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Ranked by AI confidence score</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {loading ? [1,2,3,4,5,6].map(i => <Skeleton key={i} />) : topBuys.map(s => <StockCard key={s.symbol} stock={s} />)}
          {!loading && topBuys.length === 0 && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1', padding: 24, textAlign: 'center' }}>
              No strong BUY signals found today. Check back later.
            </div>
          )}
        </div>
      </section>

      {/* Full Screener */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>All Stocks — AI Ratings</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['ALL','BUY','HOLD','AVOID'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: filter === f ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                color: filter === f ? '#fff' : 'var(--text-primary)',
                fontWeight: filter === f ? 600 : 400, transition: 'all 0.15s'
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  {['Stock','Sector','Price','Change','Rating (0-100)','Fundamental','Technical','Sentiment','Risk','Signal'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan={10} style={{ padding: 12 }}><div className="shimmer" style={{ height: 14 }} /></td></tr>
                )) : filtered.map(s => {
                  const up = s.change_pct >= 0
                  const ratingColor = s.confidence >= 65 ? 'var(--accent-green)' : s.confidence >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                  return (
                    <tr key={s.symbol} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => window.location.href = `/stock/${s.symbol}`}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.symbol.replace('.NS','')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{s.sector}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(s.price)}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {up ? '+' : ''}{s.change_pct?.toFixed(2)}%
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99 }}>
                            <div style={{ height: '100%', width: `${s.confidence}%`, background: ratingColor, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: ratingColor, minWidth: 36 }}>{s.confidence}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{s.scores.fundamental}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{s.scores.technical}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{s.scores.sentiment}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{s.scores.risk}</td>
                      <td style={{ padding: '14px 16px' }}><SignalBadge signal={s.signal} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
