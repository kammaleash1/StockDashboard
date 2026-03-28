'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = 'http://localhost:8000'

const NSE_SYMBOLS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'HINDUNILVR.NS','SBIN.NS','BHARTIARTL.NS','ITC.NS','KOTAKBANK.NS',
  'LT.NS','AXISBANK.NS','ASIANPAINT.NS','MARUTI.NS','TITAN.NS',
  'SUNPHARMA.NS','WIPRO.NS','ULTRACEMCO.NS','BAJFINANCE.NS','NESTLEIND.NS'
]

function fmt(n: any) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function SignalBadge({ signal }: { signal: string }) {
  const cls = signal === 'BUY' ? 'badge-buy' : signal === 'HOLD' ? 'badge-hold' : 'badge-avoid'
  return <span className={cls}>{signal}</span>
}

function RatingGauge({ score }: { score: number }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  const r = 36, cx = 44, cy = 44
  const toRad = (d: number) => (d * Math.PI) / 180
  const startAngle = 180
  const endAngle = 180 + (score / 100) * 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="88" height="52" viewBox="0 0 88 52">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border)" strokeWidth="7" strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"/>
        <text x={cx} y={cy - 2} fontSize="15" fontWeight="800" fill={color} textAnchor="middle">{score}</text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -4 }}>/ 100</span>
    </div>
  )
}

function WatchlistCard({ stock, onRemove }: { stock: any; onRemove: (sym: string) => void }) {
  const up = stock.change_pct >= 0
  const ratingColor = stock.confidence >= 65 ? 'var(--accent-green)' : stock.confidence >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div className="card" style={{ padding: '18px 20px', position: 'relative', transition: 'transform 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

      {/* Remove button */}
      <button onClick={() => onRemove(stock.symbol)}
        style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
        title="Remove from watchlist">×</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{stock.symbol.replace('.NS', '')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</div>
        </div>
        <SignalBadge signal={stock.signal} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>₹{fmt(stock.price)}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {up ? '▲ +' : '▼ '}{stock.change_pct?.toFixed(2)}%
          </div>
        </div>
        <RatingGauge score={stock.confidence} />
      </div>

      {/* Score bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {[
          ['Fund.', stock.scores.fundamental],
          ['Tech.', stock.scores.technical],
          ['Sent.', stock.scores.sentiment],
          ['Risk', stock.scores.risk],
        ].map(([label, val]: any) => {
          const c = val >= 65 ? 'var(--accent-green)' : val >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 30 }}>{label}</span>
              <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${val}%`, background: c, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: c, width: 24, textAlign: 'right' }}>{val}</span>
            </div>
          )
        })}
      </div>

      {/* Overall rating */}
      <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AI Rating</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: ratingColor }}>{stock.confidence}/100</span>
      </div>

      <Link href={`/stock/${stock.symbol}`} style={{
        display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8,
        background: 'var(--accent-blue)', color: '#fff', fontSize: 13,
        fontWeight: 600, textDecoration: 'none'
      }}>
        Full Analysis →
      </Link>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Your watchlist is empty</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Add stocks to track their AI ratings and signals daily</p>
      <button onClick={onAdd} style={{
        padding: '10px 24px', borderRadius: 8, background: 'var(--accent-blue)',
        color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer'
      }}>Add your first stock</button>
    </div>
  )
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [stockData, setStockData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stocksense_watchlist')
    if (saved) {
      const symbols = JSON.parse(saved)
      setWatchlist(symbols)
      symbols.forEach((sym: string) => fetchStock(sym))
    }
  }, [])

  function saveWatchlist(symbols: string[]) {
    localStorage.setItem('stocksense_watchlist', JSON.stringify(symbols))
    setWatchlist(symbols)
  }

  async function fetchStock(symbol: string) {
    setLoading(prev => ({ ...prev, [symbol]: true }))
    try {
      const data = await fetch(`${API}/analyze/${symbol}`).then(r => r.json())
      setStockData(prev => ({ ...prev, [symbol]: data }))
      setLastUpdated(new Date().toLocaleTimeString('en-IN'))
    } catch (e) {
      console.error(`Failed to fetch ${symbol}`, e)
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }))
    }
  }

  function addStock(symbol: string) {
    if (watchlist.includes(symbol)) return
    const updated = [...watchlist, symbol]
    saveWatchlist(updated)
    fetchStock(symbol)
    setShowAdd(false)
    setAddSearch('')
  }

  function removeStock(symbol: string) {
    const updated = watchlist.filter(s => s !== symbol)
    saveWatchlist(updated)
    setStockData(prev => { const n = { ...prev }; delete n[symbol]; return n })
  }

  function refreshAll() {
    watchlist.forEach(sym => fetchStock(sym))
  }

  const filtered = NSE_SYMBOLS.filter(s =>
    addSearch === '' || s.toLowerCase().includes(addSearch.toLowerCase())
  ).filter(s => !watchlist.includes(s))

  const buyCount  = watchlist.filter(s => stockData[s]?.signal === 'BUY').length
  const holdCount = watchlist.filter(s => stockData[s]?.signal === 'HOLD').length
  const avoidCount = watchlist.filter(s => stockData[s]?.signal === 'AVOID').length

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>My Watchlist</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            {watchlist.length} stocks tracked
            {lastUpdated && <span> · Updated {lastUpdated}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {watchlist.length > 0 && (
            <button onClick={refreshAll} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13
            }}>Refresh All</button>
          )}
          <button onClick={() => setShowAdd(true)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: 'var(--accent-blue)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}>+ Add Stock</button>
        </div>
      </div>

      {/* Summary bar */}
      {watchlist.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Tracking', value: watchlist.length, color: 'var(--accent-blue)' },
            { label: 'BUY', value: buyCount, color: 'var(--accent-green)' },
            { label: 'HOLD', value: holdCount, color: 'var(--accent-yellow)' },
            { label: 'AVOID', value: avoidCount, color: 'var(--accent-red)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 420, border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Add stock to watchlist</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <input
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Search NSE stocks..."
              autoFocus
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 12, outline: 'none' }}
            />
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.length === 0
                ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No stocks found</div>
                : filtered.map(sym => (
                  <div key={sym} onClick={() => addStock(sym)}
                    style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{sym.replace('.NS','')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>NSE</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600 }}>+ Add</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {watchlist.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState onAdd={() => setShowAdd(true)} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {watchlist.map(sym => {
            if (loading[sym] && !stockData[sym]) return (
              <div key={sym} className="card shimmer" style={{ height: 360 }} />
            )
            if (!stockData[sym]) return null
            return <WatchlistCard key={sym} stock={stockData[sym]} onRemove={removeStock} />
          })}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Watchlist is saved locally on your browser · For educational purposes only · Not financial advice
      </div>
    </div>
  )
}