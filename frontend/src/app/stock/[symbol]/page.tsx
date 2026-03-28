'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createChart } from 'lightweight-charts'

const API = 'http://localhost:8000'

function fmt(n: any) {
  if (n == null) return '—'
  if (typeof n === 'number') {
    if (Math.abs(n) >= 1e9) return '₹' + (n / 1e9).toFixed(2) + 'B'
    if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(2) + 'Cr'
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }
  return n
}

function pct(n: any) {
  if (n == null) return '—'
  return (n * 100).toFixed(2) + '%'
}

// ─── Rating Gauge ─────────────────────────────────────────
function RatingGauge({ score }: { score: number }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  const label = score >= 65 ? 'Strong BUY' : score >= 42 ? 'HOLD' : 'AVOID'

  const r = 80, cx = 110, cy = 110
  const toRad = (d: number) => (d * Math.PI) / 180
  const startAngle = 180
  const endAngle = 180 + (score / 100) * 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
      <svg width="220" height="130" viewBox="0 0 220 130">
        {/* Track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border)" strokeWidth="16" strokeLinecap="round"/>
        {/* Score arc */}
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"/>
        {/* Labels */}
        <text x="26" y={cy + 24} fontSize="10" fill="var(--text-muted)" textAnchor="middle">0</text>
        <text x={cx} y="36" fontSize="10" fill="var(--text-muted)" textAnchor="middle">50</text>
        <text x="194" y={cy + 24} fontSize="10" fill="var(--text-muted)" textAnchor="middle">100</text>
        {/* Score */}
        <text x={cx} y={cy - 8} fontSize="36" fontWeight="800" fill={color} textAnchor="middle">{score}</text>
        <text x={cx} y={cy + 16} fontSize="13" fill="var(--text-muted)" textAnchor="middle">out of 100</text>
      </svg>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginTop: -8 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>AI Confidence Score</div>
    </div>
  )
}

// ─── Layer Score Bar ──────────────────────────────────────
function LayerBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color = score >= 65 ? 'var(--accent-green)' : score >= 42 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Weight: {weight}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{score}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/100</span></span>
      </div>
      <div style={{ height: 10, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

// ─── Candlestick Chart ────────────────────────────────────
function CandleChart({ symbol, theme }: { symbol: string; theme: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!ref.current) return
    const isDark = theme === 'dark'
    chartRef.current = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 340,
      layout: {
        background: { color: isDark ? '#1a1d27' : '#ffffff' },
        textColor: isDark ? '#9ca3af' : '#4b5563',
      },
      grid: {
        vertLines: { color: isDark ? '#2a2d3e' : '#e5e7eb' },
        horzLines: { color: isDark ? '#2a2d3e' : '#e5e7eb' },
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: isDark ? '#2a2d3e' : '#e5e7eb' },
    })
    const series = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    fetch(`${API}/chart/${symbol}?period=6mo`)
      .then(r => r.json())
      .then(data => { series.setData(data.data); chartRef.current.timeScale().fitContent() })
      .catch(console.error)
    const ro = new ResizeObserver(() => {
      if (ref.current) chartRef.current.applyOptions({ width: ref.current.clientWidth })
    })
    ro.observe(ref.current)
    return () => { ro.disconnect(); chartRef.current.remove() }
  }, [symbol, theme])

  return <div ref={ref} style={{ width: '100%' }} />
}

// ─── Fundamental Row ──────────────────────────────────────
function FundRow({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{label}</td>
      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }}>{value}</td>
    </tr>
  )
}

// ─── Main Stock Page ──────────────────────────────────────
export default function StockPage() {
  const params = useParams()
  const symbol = decodeURIComponent(params.symbol as string)
  const [data, setData] = useState<any>(null)
  const [fund, setFund] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [period, setPeriod] = useState('6mo')

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme') || 'dark'
    setTheme(t)
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    })
    obs.observe(document.documentElement, { attributes: true })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/analyze/${symbol}`).then(r => r.json()),
      fetch(`${API}/fundamentals/${symbol}`).then(r => r.json())
    ]).then(([a, f]) => {
      setData(a); setFund(f)
    }).finally(() => setLoading(false))
  }, [symbol])

  if (loading) return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {[200, 300, 200].map((h, i) => (
        <div key={i} className="card shimmer" style={{ height: h, marginBottom: 16 }} />
      ))}
    </div>
  )

  if (!data) return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Stock not found.</div>

  const up = data.change_pct >= 0

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{symbol.replace('.NS', '')}</h1>
              <span className={`badge-${data.signal.toLowerCase()}`} style={{ fontSize: 14, padding: '4px 14px' }}>{data.signal}</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{data.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{data.sector} • NSE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>₹{fmt(data.price)}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {up ? '▲ +' : '▼ '}{data.change_pct?.toFixed(2)}% today
            </div>
            {data.target_price && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Target: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>₹{fmt(data.target_price)}</span>
                &nbsp;|&nbsp;Stop Loss: <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>₹{fmt(data.stop_loss)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Chart */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Price Chart</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {['1mo','3mo','6mo','1y'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: period === p ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: period === p ? '#fff' : 'var(--text-secondary)'
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <CandleChart symbol={symbol} theme={theme} key={period + theme} />
          </div>

          {/* Fundamentals Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Fundamental Data</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <table style={{ borderCollapse: 'collapse', borderRight: '1px solid var(--border)' }}>
                <tbody>
                  <FundRow label="P/E Ratio" value={fmt(fund?.pe_ratio)} />
                  <FundRow label="P/B Ratio" value={fmt(fund?.pb_ratio)} />
                  <FundRow label="EPS (TTM)" value={fund?.eps ? '₹' + fmt(fund.eps) : '—'} />
                  <FundRow label="Return on Equity" value={pct(fund?.roe)} />
                  <FundRow label="Profit Margin" value={pct(fund?.profit_margin)} />
                  <FundRow label="Dividend Yield" value={pct(fund?.dividend_yield)} />
                </tbody>
              </table>
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <FundRow label="Market Cap" value={fmt(fund?.market_cap)} />
                  <FundRow label="Debt / Equity" value={fmt(fund?.debt_equity)} />
                  <FundRow label="Free Cash Flow" value={fmt(fund?.free_cashflow)} />
                  <FundRow label="52W High" value={fund?.['52w_high'] ? '₹' + fmt(fund['52w_high']) : '—'} />
                  <FundRow label="52W Low" value={fund?.['52w_low'] ? '₹' + fmt(fund['52w_low']) : '—'} />
                  <FundRow label="Beta" value={fmt(fund?.beta)} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI Rating Gauge */}
          <div className="card" style={{ padding: '20px 16px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>AI Rating Score</h3>
            <RatingGauge score={data.confidence} />
          </div>

          {/* 5-Layer Breakdown */}
          <div className="card" style={{ padding: '20px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>5-Layer Score Breakdown</h3>
            <LayerBar label="Fundamental" score={data.scores.fundamental} weight="35%" />
            <LayerBar label="Technical" score={data.scores.technical} weight="30%" />
            <LayerBar label="Risk" score={data.scores.risk} weight="20%" />
            <LayerBar label="Sentiment" score={data.scores.sentiment} weight="15%" />
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Overall Score Formula</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                (F×35% + T×30% + R×20% + S×15%) = <strong style={{ color: 'var(--text-primary)' }}>{data.confidence}/100</strong>
              </div>
            </div>
          </div>

          {/* Signal Card */}
          <div className="card" style={{ padding: '20px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>AI Recommendation</h3>
            <div style={{
              padding: '14px 16px', borderRadius: 10, textAlign: 'center',
              background: data.signal === 'BUY' ? 'rgba(34,197,94,0.1)' : data.signal === 'HOLD' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${data.signal === 'BUY' ? 'rgba(34,197,94,0.3)' : data.signal === 'HOLD' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: data.signal === 'BUY' ? 'var(--accent-green)' : data.signal === 'HOLD' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                {data.signal}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Based on 5-layer AI analysis</div>
            </div>
            {data.target_price && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Target Price</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>₹{fmt(data.target_price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Stop Loss</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)' }}>₹{fmt(data.stop_loss)}</span>
                </div>
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              For educational purposes only. Not financial advice.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}