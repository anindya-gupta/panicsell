export interface Holding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  quantity: number;
  t1_quantity: number;
  total_quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  pnl_percentage: number;
  day_change: number;
  day_change_percentage: number;
  product: string;
  is_t1: boolean;
  broker: string;
}

export interface PortfolioSummary {
  total_invested: number;
  total_current: number;
  total_pnl: number;
  total_pnl_percentage: number;
  stock_count: number;
}

export interface HoldingsResponse {
  holdings: Holding[];
  summary: PortfolioSummary;
}

export interface BrokerStatus {
  broker: string;
  display_name: string;
  connected: boolean;
  coming_soon?: boolean;
  user_name?: string;
  user_id?: string;
}

export interface AuthStatusResponse {
  brokers: BrokerStatus[];
}

export interface OrderResult {
  tradingsymbol: string;
  quantity: number;
  order_id: string | null;
  status: "success" | "failed";
  error: string | null;
  broker: string;
}

export interface SellResponse {
  results: OrderResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface MarginInfo {
  available_cash: number;
  used_margin: number;
  opening_balance: number;
  broker: string;
}

export interface MarginsResponse {
  margins: MarginInfo[];
  combined: {
    available_cash: number;
    used_margin: number;
  };
}

export interface OrderHistoryItem {
  order_id: string;
  tradingsymbol: string;
  exchange: string;
  transaction_type: string;
  quantity: number;
  price: number;
  status: string;
  order_type: string;
  variety: string;
  placed_at: string;
  broker: string;
}

export interface MarketStatus {
  status: string;
  is_open: boolean;
  allows_amo: boolean;
  reason: string;
  current_time: string;
  market_open: string;
  market_close: string;
}

export interface AlertConfig {
  enabled: boolean;
  email: string;
  thresholds: Record<string, number>;
  baselines: Record<string, number>;
  last_triggered: Record<string, number>;
}
