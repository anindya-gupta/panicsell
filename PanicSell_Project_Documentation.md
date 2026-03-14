# PanicSell — Project Documentation

**One-Click Stock Liquidation Tool for Zerodha**

| | |
|---|---|
| **Version** | 1.0.0 |
| **Author** | Anindya G |
| **Date** | March 2026 |
| **Stack** | Python (FastAPI) + React (TypeScript) + Zerodha Kite Connect API |

---

## Table of Contents

1. Project Overview
2. Problem Statement & Motivation
3. Architecture
4. Tech Stack
5. Project Structure
6. Zerodha Kite Connect API Integration
7. Authentication Flow
8. Core Features
9. Backend — API Design
10. Frontend — Component Architecture
11. Safety & Confirmation Mechanisms
12. SEBI Compliance & Legal Considerations
13. Setup & Installation
14. Future Enhancements

---

## 1. Project Overview

**PanicSell** is a personal-use web application that connects to a user's Zerodha brokerage account via the Kite Connect API. It provides a clean dashboard to view all equity holdings with real-time profit/loss data, and enables rapid liquidation of stocks — either individually selected or the entire portfolio — with a single action.

The tool is designed for moments of market panic, where speed of execution matters and manually selling each stock through a trading platform is too slow.

---

## 2. Problem Statement & Motivation

During sharp market downturns, retail investors on platforms like Zerodha must sell each stock individually — navigating to the stock, entering quantity, confirming the order. With a portfolio of 15–20 stocks, this can take several minutes.

PanicSell solves this by providing:

- **Batch selling** — select multiple stocks and sell them all at once
- **One-click full liquidation** — a single "Panic Sell All" button to exit every position
- **Instant execution** — market orders placed programmatically via API, no manual form-filling

---

## 3. Architecture

The application follows a standard client-server architecture:

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  React Frontend  │──────▶│  FastAPI Backend  │──────▶│  Zerodha Kite    │
│  localhost:5173  │  API  │  localhost:8000   │  SDK  │  api.kite.trade  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

Vite proxies all `/api/*` requests from the frontend to the backend during development.

### Data Flow

1. User opens the app in browser → frontend loads from Vite dev server
2. User clicks "Connect Zerodha" → redirected to Kite OAuth login page
3. After login, Kite redirects back to backend callback with a request token
4. Backend exchanges request token for access token (valid ~24 hours)
5. Frontend fetches holdings via backend → backend calls Kite API → returns processed data
6. User triggers sell → backend places market sell orders via Kite API → returns results

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python 3.12, FastAPI | REST API server with async support, auto OpenAPI docs |
| **Broker SDK** | kiteconnect v5 | Official Zerodha Python SDK for OAuth, holdings, orders |
| **Config** | pydantic-settings, python-dotenv | Type-safe environment variable management |
| **Frontend** | React 18, TypeScript | Component-based UI with type safety |
| **Build Tool** | Vite | Fast HMR dev server with API proxy to backend |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, consistent UI design |
| **Database** | None (v1) | All data fetched live from Kite API; no persistence needed |

---

## 5. Project Structure

```
panicsell/
├── backend/
│   ├── app/
│   │   ├── main.py              — FastAPI app, CORS, router registration
│   │   ├── config.py            — Settings from .env via pydantic-settings
│   │   ├── routers/
│   │   │   ├── auth.py          — Kite OAuth login, callback, status, logout
│   │   │   ├── portfolio.py     — GET /holdings with P&L calculations
│   │   │   └── orders.py        — POST /panic-sell for batch market sell
│   │   └── services/
│   │       └── kite_service.py  — Singleton wrapper around Kite Connect SDK
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                     — (git-ignored) API credentials
├── frontend/
│   ├── src/
│   │   ├── App.tsx              — Root component, state management
│   │   ├── components/
│   │   │   ├── Header.tsx               — Nav bar with connection status
│   │   │   ├── PortfolioSummaryBar.tsx  — Summary cards
│   │   │   ├── HoldingsTable.tsx        — Stock table with checkboxes
│   │   │   ├── ConfirmModal.tsx         — Confirmation dialogs
│   │   │   └── OrderResults.tsx         — Sell results display
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       — Zerodha connection state
│   │   │   ├── usePortfolio.ts  — Holdings data fetching
│   │   │   └── usePanicSell.ts  — Sell execution logic
│   │   └── types/
│   │       └── index.ts         — TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 6. Zerodha Kite Connect API Integration

### What is Kite Connect?

Kite Connect is Zerodha's official REST API platform that allows developers to build trading applications. It provides endpoints for authentication, portfolio data, order placement, market data, and more.

### API Endpoints Used

| SDK Method | HTTP Method | What It Does |
|-----------|------------|--------------|
| `kite.login_url()` | — | Generates Zerodha OAuth login URL |
| `kite.generate_session()` | POST | Exchanges request token for access token |
| `kite.holdings()` | GET | Fetches all delivery equity holdings |
| `kite.profile()` | GET | Gets user profile (name, ID) |
| `kite.place_order()` | POST | Places a market sell order |
| `kite.invalidate_access_token()` | DELETE | Logs out / invalidates session |

### API Pricing

| Plan | Cost | Includes |
|------|------|----------|
| **Personal (Free)** | ₹0/month | Order management, portfolio, GTT, alerts — sufficient for PanicSell |
| Connect | ₹500/month | Adds live WebSocket streaming, historical candle data |

---

## 7. Authentication Flow

### OAuth Login Sequence

| Step | Description |
|------|------------|
| **Step 1** | User clicks "Connect Zerodha" in the frontend |
| **Step 2** | Frontend navigates to `/api/auth/login` → backend redirects to Kite login page |
| **Step 3** | User enters Zerodha ID + Password + TOTP on Kite's login page |
| **Step 4** | Kite redirects to `/api/auth/callback?request_token=xxx&status=success` |
| **Step 5** | Backend calls `generate_session()` to exchange request token → access token |
| **Step 6** | Backend stores access token in memory, redirects user to frontend with `?connected=true` |
| **Done** | Access token valid for ~24 hours. No TOTP needed for subsequent API calls. |

### Key Detail: TOTP is Only Needed at Login

The TOTP (Time-based One-Time Password) from Google Authenticator is required only during the OAuth login step. Once the access token is obtained, all API calls (fetching holdings, placing orders) work without any additional authentication until the token expires.

### Daily Login Required

Access tokens are invalidated by Zerodha between 6:00–8:30 AM daily. Per SEBI exchange regulations, users must log in manually once per day. There is no refresh token mechanism available for standard API users.

---

## 8. Core Features

### 8.1 Portfolio Dashboard

- Displays all delivery equity holdings fetched from Zerodha
- Summary cards: Total Invested, Current Value, Total P&L (with %), Stock Count
- Holdings table with columns: Stock, Qty, Avg Price, LTP, P&L, P&L %, Day Change
- Color-coded profit (green) and loss (red) indicators
- Manual refresh button to re-fetch latest data

### 8.2 Sell Selected

- Each stock row has a checkbox for individual selection
- "Select All / Deselect All" toggle via header checkbox (with indeterminate state)
- Clicking a row toggles its selection
- "Sell Selected (N)" button — shows count of selected stocks
- Confirmation modal displays the list of selected stocks with quantities and estimated values
- On confirm, places market sell orders for each selected stock

### 8.3 Panic Sell All

- Large red button with subtle pulse animation, always visible below the holdings table
- No stock selection needed — sells the entire portfolio
- Confirmation modal requires typing "SELL ALL" to proceed (typed confirmation gate)
- Shows all holdings that will be sold with total estimated liquidation value
- On confirm, places market sell orders for every holding with quantity > 0

### 8.4 Order Results

- After sell execution, a results modal displays the outcome of each order
- Per-stock status: success (with order ID) or failed (with error message)
- Summary counts: total orders, successful, failed
- Portfolio auto-refreshes after orders complete

---

## 9. Backend — API Design

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/login` | Redirects to Zerodha Kite OAuth login |
| GET | `/api/auth/callback` | OAuth callback — exchanges token, redirects to frontend |
| GET | `/api/auth/status` | Returns connection status and user info |
| POST | `/api/auth/logout` | Invalidates access token |
| GET | `/api/portfolio/holdings` | Returns holdings with computed P&L and summary |
| POST | `/api/orders/panic-sell` | Batch sell — accepts optional symbol list |
| GET | `/api/health` | Health check |

### Panic Sell Endpoint — Request/Response

**Request Body:**

```json
{
  "symbols": ["RELIANCE", "TCS"]   // or null to sell ALL
}
```

**Response:**

```json
{
  "results": [
    {
      "tradingsymbol": "RELIANCE",
      "quantity": 10,
      "order_id": "220312000123456",
      "status": "success",
      "error": null
    }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

### KiteService — Core Backend Service

The `KiteService` class is a singleton wrapper around the official `kiteconnect` Python SDK. It manages the Kite session lifecycle and provides clean methods for the routers:

```python
class KiteService:
    def generate_session(self, request_token: str) -> dict
    def get_holdings(self) -> list[dict]
    def place_sell_order(self, tradingsymbol, exchange, quantity, product) -> str
    def get_profile(self) -> dict
    def logout(self)
```

---

## 10. Frontend — Component Architecture

### Components

| Component | Responsibility |
|-----------|---------------|
| `App.tsx` | Root component. Manages auth state, selection state, confirmation mode. Orchestrates all child components. |
| `Header` | Top navigation bar. Shows "Connect Zerodha" when disconnected, user info + "Disconnect" when connected. |
| `PortfolioSummaryBar` | Four summary cards showing invested amount, current value, total P&L, and stock count. |
| `HoldingsTable` | Full holdings table with checkboxes. Supports select all (with indeterminate state), row click to toggle, and color-coded P&L. |
| `ConfirmModal` | Shared confirmation dialog. "Selected" mode shows stock list; "All" mode requires typing "SELL ALL" to confirm. |
| `OrderResults` | Post-sell results modal showing per-stock success/failure with order IDs. |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth()` | Manages Zerodha connection state, login/logout actions, status polling |
| `usePortfolio()` | Fetches and stores holdings data and portfolio summary |
| `usePanicSell()` | Handles sell execution, loading state, and result storage |

---

## 11. Safety & Confirmation Mechanisms

Since this tool places real market orders with real money, multiple safety layers are built in:

| Mechanism | Description |
|-----------|-------------|
| **Typed confirmation** | Panic Sell All requires typing "SELL ALL" — prevents accidental clicks |
| **List confirmation** | Sell Selected shows the exact stocks, quantities, and values before confirming |
| **Button disabling** | Both sell buttons are disabled while orders are in-flight (prevents double-execution) |
| **Empty selection guard** | "Sell Selected" button is disabled when no stocks are checked |
| **Backend validation** | Server verifies holdings exist with quantity > 0 before placing orders |
| **Per-order error handling** | If one order fails, others still proceed; all results reported individually |
| **Logging** | All sell orders logged server-side with symbol, quantity, and order ID |
| **Daily session expiry** | Tokens auto-expire overnight — no stale sessions that could be triggered accidentally |

---

## 12. SEBI Compliance & Legal Considerations

> **Important: This Tool is for Personal Use Only.**
> PanicSell is designed and intended for personal portfolio management on a single Zerodha account. It must not be used to trade on behalf of others, offered as a service, or distributed commercially.

### SEBI 2025 Regulatory Framework Compliance

| Requirement | How PanicSell Complies |
|-------------|----------------------|
| Personal use, single account | Connects to one Zerodha account only; no multi-user support |
| 2FA / TOTP mandatory | Enforced by Zerodha's login — users must enter TOTP at OAuth login |
| Manual trigger (not automated) | All sells require explicit user action (button click + confirmation) |
| Daily manual login required | Token expires daily; user must re-authenticate each morning |
| No exchange registration needed | Personal-use tools with manual triggers don't require exchange approval |
| No data redistribution | Portfolio data is displayed only to the authenticated user locally |
| Order frequency thresholds | Batch sell is a single user action; does not approach algo-trading OPS limits |

### What is NOT Permitted

- Using this tool on multiple accounts or for third-party trading
- Automating the login/TOTP step (e.g., via pyotp on a cron job)
- Offering this as a copy-trading or signal service
- Marketing strategies as "SEBI-approved algorithms"

---

## 13. Setup & Installation

### Prerequisites

- A Zerodha trading account
- Python 3.10+ and Node.js 18+
- TOTP enabled on your Zerodha account (via Google Authenticator or similar)

### Step 1: Zerodha Developer App

1. Sign up at `developers.kite.trade`
2. Create a new app (Personal plan, free)
3. Enter your Zerodha Client ID (your trading user ID)
4. Set Redirect URL to `http://localhost:8000/api/auth/callback`
5. Note the generated **API Key** and **API Secret**

### Step 2: Backend

```bash
cd panicsell/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with your credentials
cp .env.example .env
# Edit .env: KITE_API_KEY=xxx, KITE_API_SECRET=xxx

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Step 3: Frontend

```bash
cd panicsell/frontend
npm install
npm run dev
```

### Step 4: Use the App

1. Open `http://localhost:5173` in your browser
2. Click "Connect Zerodha" and log in with your credentials + TOTP
3. View your portfolio, select stocks, and sell as needed

---

## 14. Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| Live price streaming | WebSocket connection for real-time LTP updates (requires ₹500/mo plan) |
| Stop-loss presets | Configure automatic sell triggers at predefined loss thresholds |
| Order history | Persistent log of all sell actions with timestamps and outcomes |
| Mobile responsive | Optimized layout for phone-based panic selling |
| Multi-broker support | Add Angel One, Dhan, Upstox alongside Zerodha |
| Portfolio analytics | Sector allocation, risk metrics, diversification scores |
| Notifications | Telegram/email alerts when portfolio drops below a threshold |

---

*PanicSell v1.0.0 | Built by Anindya G | March 2026*
*For personal use only. Not financial advice.*
