from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from textblob import TextBlob
import requests
from datetime import datetime
import ta
yf.set_tz_cache_location("/tmp")

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
})

app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://stock-dashboard-i2gdcpo3n-stock-sense.vercel.app","https://stockdashboard-y748.onrender.com","*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HELPERS ────────────────────────────────────────────────

NSE_POPULAR = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
    "HINDUNILVR.NS","SBIN.NS","BHARTIARTL.NS","ITC.NS","KOTAKBANK.NS",
    "LT.NS","AXISBANK.NS","ASIANPAINT.NS","MARUTI.NS","TITAN.NS",
    "SUNPHARMA.NS","WIPRO.NS","ULTRACEMCO.NS","BAJFINANCE.NS","NESTLEIND.NS"
]

def safe(val, default=None):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    return val

# ─── SCORING ENGINE ─────────────────────────────────────────

def fundamental_score(info: dict) -> float:
    score = 0
    pe = safe(info.get("trailingPE"))
    if pe:
        if pe < 15: score += 25
        elif pe < 25: score += 20
        elif pe < 40: score += 10
    de = safe(info.get("debtToEquity"))
    if de is not None:
        if de < 30: score += 25
        elif de < 80: score += 15
        elif de < 150: score += 5
    roe = safe(info.get("returnOnEquity"))
    if roe:
        if roe > 0.20: score += 25
        elif roe > 0.12: score += 15
        elif roe > 0.05: score += 5
    fcf = safe(info.get("freeCashflow"))
    if fcf and fcf > 0: score += 25
    return min(score, 100)

def technical_score(df: pd.DataFrame) -> float:
    if df is None or len(df) < 30:
        return 50
    score = 0
    close = df["Close"].squeeze()
    try:
        rsi = ta.momentum.RSIIndicator(close).rsi().iloc[-1]
        if 40 < rsi < 60: score += 30
        elif rsi < 35: score += 22
        elif rsi > 70: score += 5
    except: pass
    try:
        macd_obj = ta.trend.MACD(close)
        macd = macd_obj.macd().iloc[-1]
        signal = macd_obj.macd_signal().iloc[-1]
        if macd > signal: score += 35
        else: score += 10
    except: pass
    try:
        sma50 = close.rolling(50).mean().iloc[-1]
        sma200 = close.rolling(200).mean().iloc[-1] if len(df) >= 200 else sma50
        price = close.iloc[-1]
        if price > sma50 > sma200: score += 35
        elif price > sma50: score += 20
        else: score += 5
    except: pass
    return min(score, 100)

def sentiment_score(company_name: str) -> float:
    try:
        url = f"https://newsapi.org/v2/everything?q={company_name}+stock&language=en&pageSize=10&apiKey=demo"
        resp = requests.get(url, timeout=5).json()
        articles = resp.get("articles", [])
        if not articles:
            return 55
        scores = [TextBlob(a.get("title", "")).sentiment.polarity for a in articles]
        avg = sum(scores) / len(scores)
        return round((avg + 1) * 50, 1)
    except:
        return 55

def risk_score(df: pd.DataFrame, info: dict) -> float:
    if df is None or len(df) < 30:
        return 50
    score = 100
    close = df["Close"].squeeze()
    try:
        returns = close.pct_change().dropna()
        sharpe = (returns.mean() / returns.std()) * (252 ** 0.5)
        if sharpe < 0: score -= 30
        elif sharpe < 0.5: score -= 15
        elif sharpe > 1.5: score += 0
    except: pass
    try:
        roll_max = close.cummax()
        drawdown = ((close - roll_max) / roll_max).min()
        if drawdown < -0.40: score -= 30
        elif drawdown < -0.25: score -= 15
        elif drawdown < -0.10: score -= 5
    except: pass
    beta = safe(info.get("beta"))
    if beta:
        if beta > 2.0: score -= 20
        elif beta > 1.5: score -= 10
        elif beta < 0.5: score -= 5
    return max(0, min(score, 100))

def final_signal(f, t, s, r):
    score = f * 0.35 + t * 0.30 + s * 0.15 + r * 0.20
    if score >= 65: signal = "BUY"
    elif score >= 42: signal = "HOLD"
    else: signal = "AVOID"
    return signal, round(score, 1)

def get_target_price(info, signal, current_price):
    if not current_price: return None, None
    if signal == "BUY":
        target = round(current_price * 1.15, 2)
        stop_loss = round(current_price * 0.93, 2)
    elif signal == "HOLD":
        target = round(current_price * 1.06, 2)
        stop_loss = round(current_price * 0.96, 2)
    else:
        target = None
        stop_loss = round(current_price * 0.97, 2)
    return target, stop_loss

# ─── ROUTES ─────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "StockSense API running", "version": "1.0"}

@app.get("/analyze/{symbol}")
def analyze(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=session)
        df = ticker.history(period="1y")
        info = ticker.info
        if df.empty:
            raise HTTPException(status_code=404, detail="Symbol not found")
        f = fundamental_score(info)
        t = technical_score(df)
        s = sentiment_score(info.get("shortName", symbol))
        r = risk_score(df, info)
        signal, confidence = final_signal(f, t, s, r)
        price = safe(info.get("currentPrice")) or safe(info.get("regularMarketPrice"))
        target, stop_loss = get_target_price(info, signal, price)
        prev_close = safe(info.get("previousClose"))
        change_pct = round(((price - prev_close) / prev_close) * 100, 2) if price and prev_close else None
        return {
            "symbol": symbol,
            "name": safe(info.get("longName"), symbol),
            "signal": signal,
            "confidence": confidence,
            "price": price,
            "change_pct": change_pct,
            "target_price": target,
            "stop_loss": stop_loss,
            "sector": safe(info.get("sector"), "N/A"),
            "market_cap": safe(info.get("marketCap")),
            "scores": {
                "fundamental": round(f, 1),
                "technical": round(t, 1),
                "sentiment": round(s, 1),
                "risk": round(r, 1)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chart/{symbol}")
def chart(symbol: str, period: str = "6mo"):
    try:
        ticker = yf.Ticker(symbol, session=session)
        df = ticker.history(period=period)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data")
        df = df.reset_index()
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")
        return {
            "symbol": symbol,
            "data": [
                {
                    "time": row["Date"],
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"])
                }
                for _, row in df.iterrows()
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/fundamentals/{symbol}")
def fundamentals(symbol: str):
    try:
        info = yf.Ticker(symbol, session=session).info
        return {
            "pe_ratio": safe(info.get("trailingPE")),
            "pb_ratio": safe(info.get("priceToBook")),
            "eps": safe(info.get("trailingEps")),
            "roe": safe(info.get("returnOnEquity")),
            "debt_equity": safe(info.get("debtToEquity")),
            "free_cashflow": safe(info.get("freeCashflow")),
            "dividend_yield": safe(info.get("dividendYield")),
            "revenue": safe(info.get("totalRevenue")),
            "profit_margin": safe(info.get("profitMargins")),
            "52w_high": safe(info.get("fiftyTwoWeekHigh")),
            "52w_low": safe(info.get("fiftyTwoWeekLow")),
            "avg_volume": safe(info.get("averageVolume")),
            "beta": safe(info.get("beta")),
            "market_cap": safe(info.get("marketCap")),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/screener")
def screener(signal: str = "ALL"):
    results = []
    for sym in NSE_POPULAR:
        try:
            ticker = yf.Ticker(sym)
            df = ticker.history(period="6mo")
            info = ticker.info
            if df.empty: continue
            f = fundamental_score(info)
            t = technical_score(df)
            s = sentiment_score(info.get("shortName", sym))
            r = risk_score(df, info)
            sig, conf = final_signal(f, t, s, r)
            if signal != "ALL" and sig != signal.upper():
                continue
            price = safe(info.get("currentPrice")) or safe(info.get("regularMarketPrice"))
            prev_close = safe(info.get("previousClose"))
            change_pct = round(((price - prev_close) / prev_close) * 100, 2) if price and prev_close else None
            results.append({
                "symbol": sym,
                "name": safe(info.get("shortName"), sym),
                "signal": sig,
                "confidence": conf,
                "price": price,
                "change_pct": change_pct,
                "sector": safe(info.get("sector"), "N/A"),
                "scores": {"fundamental": round(f,1), "technical": round(t,1), "sentiment": round(s,1), "risk": round(r,1)}
            })
        except:
            continue
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return {"count": len(results), "stocks": results}

@app.get("/search")
def search(q: str):
    matches = [s for s in NSE_POPULAR if q.upper() in s.upper()]
    results = []
    for sym in matches[:8]:
        try:
            info = yf.Ticker(sym).info
            results.append({
                "symbol": sym,
                "name": safe(info.get("shortName"), sym),
                "sector": safe(info.get("sector"), "N/A")
            })
        except:
            results.append({"symbol": sym, "name": sym, "sector": "N/A"})
    return {"results": results}

@app.get("/market-overview")
def market_overview():
    indices = {
        "NIFTY 50": "^NSEI",
        "SENSEX": "^BSESN",
        "NIFTY BANK": "^NSEBANK",
        "NIFTY IT": "^CNXIT"
    }
    result = []
    for name, sym in indices.items():
        try:
            info = yf.Ticker(sym).info
            price = safe(info.get("regularMarketPrice"))
            prev = safe(info.get("regularMarketPreviousClose"))
            change_pct = round(((price - prev) / prev) * 100, 2) if price and prev else None
            result.append({"name": name, "symbol": sym, "price": price, "change_pct": change_pct})
        except:
            continue
    return {"indices": result}