# PanicSell

Multi-broker stock liquidation tool for the Indian market. View your unified portfolio across Zerodha and Groww, then sell stocks instantly -- individually, per-broker, or all at once.

## Features

- **Unified Dashboard** -- Cross-broker view of all holdings with P&L, color-coded
- **Sell Selected** -- Pick specific stocks to sell with checkboxes + Select All
- **Panic Sell [Broker]** -- Liquidate all stocks on a specific broker
- **MEGA PANIC SELL ALL** -- Emergency button to sell everything across all connected brokers
- **AMO Support** -- Queue sell orders for next market opening when markets are closed
- **Market Hours Detection** -- Warns if markets are closed, auto-suggests AMO
- **Funds & Margins** -- View available cash and margin per broker
- **Order History** -- See today's orders across all brokers
- **Email Alerts** -- Get notified when a broker portfolio drops by X%
- **Broker Tabs** -- Filter dashboard to view All, Zerodha-only, or Groww-only
- **Glassmorphism UI** -- Dark, animated, modern interface

## Prerequisites

1. A [Zerodha](https://zerodha.com) trading account and/or a [Groww](https://groww.in) trading account
2. For Zerodha: sign up at [developers.kite.trade](https://developers.kite.trade) and create an app
3. For Groww: get API credentials at [groww.in/trade-api](https://groww.in/trade-api)
4. Python 3.10+ and Node.js 18+

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment (Vercel + Render)

The recommended production setup uses **Vercel** for the React frontend and **Render** for the FastAPI backend.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create panicsell --private --source=. --push
```

### 2. Deploy Backend on Render

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repo and select the `panicsell` repository
3. Set the **Root Directory** to `backend/`
4. Render will auto-detect the `Dockerfile` and build from it
5. Set **Instance Type** to **Free** (sleeps after 15 min inactivity, wakes on first request)
6. Set these **Environment Variables** in Render's dashboard:

   | Variable | Value |
   |---|---|
   | `KITE_API_KEY` | Your Zerodha API key |
   | `KITE_API_SECRET` | Your Zerodha API secret |
   | `GROWW_TOTP_TOKEN` | Your Groww TOTP token (recommended) |
   | `GROWW_TOTP_SECRET` | Your Groww TOTP secret (recommended) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` |
   | `BACKEND_URL` | `https://your-app.onrender.com` |
   | `SMTP_EMAIL` | Gmail address for alerts (optional) |
   | `SMTP_APP_PASSWORD` | Gmail app password (optional) |

7. Render will assign a public URL like `panicsell-backend.onrender.com`

### 3. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and import the same GitHub repo
2. Set the **Root Directory** to `frontend/`
3. Vercel auto-detects Vite and builds with `npm run build`
4. No environment variables needed -- the frontend proxies `/api` requests to Render via `vercel.json`

### 4. Update URLs

After both are deployed:

1. **Update `vercel.json`**: replace the placeholder Render URL with your actual Render domain:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://YOUR-APP.onrender.com/api/:path*" }
     ]
   }
   ```
2. **Update Render env vars**: set `FRONTEND_URL` to your Vercel domain
3. **Update Zerodha**: on [developers.kite.trade](https://developers.kite.trade), change Redirect URL to `https://YOUR-APP.onrender.com/api/auth/callback`

### 5. Groww Authentication

Groww supports two authentication flows:

| Flow | Daily Approval | Fully Automatic | Recommended |
|---|---|---|---|
| API Key + Secret | Yes (manual on Groww dashboard) | No | No |
| TOTP | No | Yes | **Yes** |

To use TOTP (recommended):
- Set `GROWW_TOTP_TOKEN` and `GROWW_TOTP_SECRET` in Render env vars
- The server auto-generates TOTP codes using `pyotp` -- no daily manual approval needed

To use API Key + Secret (fallback):
- Set `GROWW_API_KEY` and `GROWW_API_SECRET` instead
- You must approve the key daily on Groww's Cloud API Keys page

### Note on Render Free Tier

Render's free tier sleeps the service after 15 minutes of inactivity. The first request after sleeping takes ~30 seconds to wake up. Once awake, it stays responsive. This is fine for personal use -- you open the dashboard, it wakes up, and stays alive while you're using it.

If you want always-on hosting, upgrade to Render's paid tier ($7/mo) or use [Fly.io](https://fly.io) (free tier with no sleeping).

## How It Works

1. Click **Connect Zerodha** -- you'll be redirected to Kite login
2. Enter your Zerodha credentials + TOTP (from your authenticator app)
3. Click **Connect Groww** -- connects automatically using stored credentials
4. Your unified portfolio loads with holdings from all connected brokers
5. Filter by broker using the tabs, select stocks, or use panic sell buttons
6. Confirm in the modal, and market sell orders are placed instantly

## Important Notes

- **TOTP is only needed at Zerodha login**, not per order. Once connected, selling works instantly.
- **Access tokens expire daily** (~6-8 AM). You'll need to reconnect each morning. Groww TOTP flow auto-reconnects.
- **Market orders** are used for immediate execution -- prices may vary from displayed LTP.
- **AMO orders** are queued for next market opening when markets are closed.
- This is a **personal use tool**. Do not distribute or use for third-party trading.
- Compliant with SEBI 2025 regulations for personal automated trading.

## Tech Stack

- **Backend**: Python, FastAPI, kiteconnect SDK, growwapi SDK, pyotp
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Deployment**: Vercel (frontend CDN) + Render (backend container)
