/**
 * Orderbook Analysis module for DOME Polymarket API.
 *
 * This module provides functions for analyzing market microstructure,
 * orderbook depth, liquidity, and price impact.
 *
 * SECURITY NOTE: All user-generated content from the DOME API is sanitized
 * using security utilities to mitigate indirect prompt injection risks (W011).
 * See security.ts for implementation details.
 */

import { sanitizeString } from "./security.js";

const BASE_URL = "https://api.domeapi.io/v1";

/** Custom error classes for DOME API */
export class DomeAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomeAPIError";
  }
}

export class DomeAPIRateLimitError extends DomeAPIError {
  constructor(message: string = "Rate limit exceeded") {
    super(message);
    this.name = "DomeAPIRateLimitError";
  }
}

/** Bid/Ask order structure */
export interface BidAsk {
  price: number;
  size: number;
}

/** Raw Bid/Ask from API */
interface RawBidAsk {
  price: string;
  size: string;
}

/** Orderbook snapshot */
export interface OrderbookSnapshot {
  asks: RawBidAsk[];
  bids: RawBidAsk[];
  hash: string;
  minOrderSize: string;
  negRisk: boolean;
  assetId: string;
  timestamp: number;
  tickSize: string;
  indexedAt: number;
  market: string;
}

/** Orderbook response */
export interface OrderbookResponse {
  snapshots: OrderbookSnapshot[];
  pagination: {
    limit: number;
    count: number;
    pagination_key?: string;
    has_more: boolean;
  };
}

/** Market price response */
export interface MarketPriceResponse {
  price: number;
  at_time: number;
}

/** Parsed orderbook data */
export interface ParsedOrderbook {
  asks: BidAsk[];
  bids: BidAsk[];
  timestamp: number;
  midPrice: number | null;
  spread: number;
  assetId: string;
  market: string;
}

/** Spread information */
export interface SpreadInfo {
  best_ask: number | null;
  best_bid: number | null;
  spread_absolute: number | null;
  spread_percentage: number | null;
}

/** Liquidity analysis */
export interface LiquidityAnalysis {
  total_ask_liquidity: number;
  total_bid_liquidity: number;
  total_liquidity: number;
  depth_2_percent: {
    ask_depth: number;
    bid_depth: number;
  };
  depth_5_percent: {
    ask_depth: number;
    bid_depth: number;
  };
  ask_vwap: number;
  bid_vwap: number;
  imbalance: number; // Positive = more ask liquidity, Negative = more bid liquidity
}

/** Price impact calculation */
export interface PriceImpact {
  executable: boolean;
  average_price: number;
  price_impact_percent: number;
  filled_size: number;
  missing_liquidity: number;
  execution_levels: Array<{
    price: number;
    size: number;
  }>;
}

/** Liquidity profile */
export interface LiquidityProfile {
  best_ask: number | null;
  best_bid: number | null;
  spread: number | null;
  ask_levels: Array<{
    price: number;
    cumulative_size: number;
    price_distance_percent: number;
  }>;
  bid_levels: Array<{
    price: number;
    cumulative_size: number;
    price_distance_percent: number;
  }>;
  total_ask_size: number;
  total_bid_size: number;
  optimal_trade_size: number;
  recommended_max_trade: number;
  liquidity_score: number; // 0-100
}

/**
 * Make a request to the DOME API
 */
async function makeRequest(
  endpoint: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (response.status === 429) {
    throw new DomeAPIRateLimitError();
  }

  if (!response.ok) {
    throw new DomeAPIError(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch orderbook history
 */
export async function fetchOrderbookHistory(
  apiKey: string,
  tokenId: string,
  params?: {
    start_time?: number;
    end_time?: number;
    limit?: number;
    pagination_key?: string;
  }
): Promise<OrderbookResponse> {
  const { start_time, end_time, limit = 100, pagination_key } = params || {};

  const queryParams: Record<string, unknown> = { token_id: tokenId, limit };
  if (start_time) queryParams.start_time = start_time;
  if (end_time) queryParams.end_time = end_time;
  if (pagination_key) queryParams.pagination_key = pagination_key;

  return makeRequest("/polymarket/orderbooks", queryParams, apiKey) as Promise<
    OrderbookResponse
  >;
}

/**
 * Fetch current market price
 */
export async function fetchMarketPrice(
  apiKey: string,
  tokenId: string,
  at_time?: number
): Promise<MarketPriceResponse> {
  const queryParams: Record<string, unknown> = {};
  if (at_time) queryParams.at_time = at_time;

  return makeRequest(
    `/polymarket/market-price/${tokenId}`,
    queryParams,
    apiKey
  ) as Promise<MarketPriceResponse>;
}

/**
 * Parse orderbook snapshot
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parseOrderbookSnapshot(
  snapshot: Partial<OrderbookSnapshot>
): ParsedOrderbook {
  const asks = (snapshot.asks || []).map((a: RawBidAsk) => ({
    price: parseFloat(a.price),
    size: parseFloat(a.size),
  }));

  const bids = (snapshot.bids || []).map((b: RawBidAsk) => ({
    price: parseFloat(b.price),
    size: parseFloat(b.size),
  }));

  // Sort asks ascending (lowest first)
  asks.sort((a, b) => a.price - b.price);
  // Sort bids descending (highest first)
  bids.sort((a, b) => b.price - a.price);

  const bestAsk = asks.length > 0 ? asks[0].price : null;
  const bestBid = bids.length > 0 ? bids[0].price : null;
  const midPrice =
    bestAsk !== null && bestBid !== null ? (bestAsk + bestBid) / 2 : null;
  const spread =
    bestAsk !== null && bestBid !== null ? bestAsk - bestBid : 0;

  return {
    asks,
    bids,
    timestamp: snapshot.timestamp || 0,
    midPrice,
    spread,
    assetId: sanitizeString(snapshot.assetId, 200) || "",
    market: sanitizeString(snapshot.market, 200) || "",
  };
}

/**
 * Calculate spread information
 */
export function calculateSpread(
  asks: BidAsk[],
  bids: BidAsk[]
): SpreadInfo {
  if (asks.length === 0 && bids.length === 0) {
    return {
      best_ask: null,
      best_bid: null,
      spread_absolute: null,
      spread_percentage: null,
    };
  }

  const bestAsk = asks.length > 0 ? asks[0].price : null;
  const bestBid = bids.length > 0 ? bids[0].price : null;

  let spreadAbs: number | null = null;
  let spreadPct: number | null = null;

  if (bestAsk !== null && bestBid !== null) {
    spreadAbs = bestAsk - bestBid;
    const midPrice = (bestAsk + bestBid) / 2;
    if (midPrice > 0) {
      spreadPct = (spreadAbs / midPrice) * 100;
    }
  }

  return {
    best_ask: bestAsk,
    best_bid: bestBid,
    spread_absolute: spreadAbs,
    spread_percentage: spreadPct,
  };
}

/**
 * Calculate weighted average price (VWAP)
 */
export function calculateWeightedAveragePrice(orders: BidAsk[]): number {
  if (orders.length === 0) return 0;

  let totalValue = 0;
  let totalSize = 0;

  for (const order of orders) {
    totalValue += order.price * order.size;
    totalSize += order.size;
  }

  return totalSize > 0 ? totalValue / totalSize : 0;
}

/**
 * Calculate depth within percentage range
 */
function calculateDepth(
  orders: BidAsk[],
  bestPrice: number,
  percentage: number,
  isAskSide: boolean
): number {
  let depth = 0;
  const threshold = bestPrice * (1 + (isAskSide ? percentage : -percentage));

  for (const order of orders) {
    if (isAskSide && order.price <= threshold) {
      depth += order.size;
    } else if (!isAskSide && order.price >= threshold) {
      depth += order.size;
    }
  }

  return depth;
}

/**
 * Analyze liquidity
 */
export function analyzeLiquidity(
  asks: BidAsk[],
  bids: BidAsk[]
): LiquidityAnalysis {
  const totalAskLiquidity = asks.reduce((sum, a) => sum + a.size, 0);
  const totalBidLiquidity = bids.reduce((sum, b) => sum + b.size, 0);

  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const bestBid = bids.length > 0 ? bids[0].price : 0;

  const depth2Pct = {
    ask_depth:
      bestAsk > 0 ? calculateDepth(asks, bestAsk, 0.02, true) : 0,
    bid_depth:
      bestBid > 0 ? calculateDepth(bids, bestBid, 0.02, false) : 0,
  };

  const depth5Pct = {
    ask_depth:
      bestAsk > 0 ? calculateDepth(asks, bestAsk, 0.05, true) : 0,
    bid_depth:
      bestBid > 0 ? calculateDepth(bids, bestBid, 0.05, false) : 0,
  };

  const askVwap = calculateWeightedAveragePrice(asks);
  const bidVwap = calculateWeightedAveragePrice(bids);

  // Imbalance: positive = more ask liquidity (sell pressure)
  // negative = more bid liquidity (buy pressure)
  const totalLiquidity = totalAskLiquidity + totalBidLiquidity;
  const imbalance =
    totalLiquidity > 0
      ? (totalAskLiquidity - totalBidLiquidity) / totalLiquidity
      : 0;

  return {
    total_ask_liquidity: totalAskLiquidity,
    total_bid_liquidity: totalBidLiquidity,
    total_liquidity: totalLiquidity,
    depth_2_percent: depth2Pct,
    depth_5_percent: depth5Pct,
    ask_vwap: askVwap,
    bid_vwap: bidVwap,
    imbalance,
  };
}

/**
 * Detect price impact for a trade
 */
export function detectPriceImpact(
  orders: BidAsk[],
  side: "buy" | "sell",
  tradeSize: number
): PriceImpact {
  if (tradeSize <= 0) {
    const bestPrice = orders.length > 0 ? orders[0].price : 0;
    return {
      executable: true,
      average_price: bestPrice,
      price_impact_percent: 0,
      filled_size: 0,
      missing_liquidity: 0,
      execution_levels: [],
    };
  }

  const sortedOrders =
    side === "buy"
      ? [...orders].sort((a, b) => a.price - b.price) // Ascending for buys
      : [...orders].sort((a, b) => b.price - a.price); // Descending for sells

  let remainingSize = tradeSize;
  let totalCost = 0;
  const executionLevels: Array<{ price: number; size: number }> = [];

  for (const order of sortedOrders) {
    if (remainingSize <= 0) break;

    const fillSize = Math.min(remainingSize, order.size);
    totalCost += fillSize * order.price;
    remainingSize -= fillSize;

    executionLevels.push({
      price: order.price,
      size: fillSize,
    });
  }

  const filledSize = tradeSize - remainingSize;
  const executable = remainingSize === 0;
  const averagePrice = filledSize > 0 ? totalCost / filledSize : 0;

  const bestPrice = sortedOrders.length > 0 ? sortedOrders[0].price : 0;
  const priceImpactPercent =
    bestPrice > 0 ? Math.abs((averagePrice - bestPrice) / bestPrice) * 100 : 0;

  return {
    executable,
    average_price: averagePrice,
    price_impact_percent: priceImpactPercent,
    filled_size: filledSize,
    missing_liquidity: remainingSize,
    execution_levels: executionLevels,
  };
}

/**
 * Get liquidity profile
 */
export function getLiquidityProfile(
  asks: BidAsk[],
  bids: BidAsk[]
): LiquidityProfile {
  const spread = calculateSpread(asks, bids);
  const liquidity = analyzeLiquidity(asks, bids);

  const bestAsk = spread.best_ask;
  const bestBid = spread.best_bid;

  // Build ask levels with cumulative sizes
  let askCumulative = 0;
  const askLevels = asks.map((ask) => {
    askCumulative += ask.size;
    const distancePercent =
      bestAsk !== null && bestAsk > 0
        ? ((ask.price - bestAsk) / bestAsk) * 100
        : 0;
    return {
      price: ask.price,
      cumulative_size: askCumulative,
      price_distance_percent: distancePercent,
    };
  });

  // Build bid levels with cumulative sizes
  let bidCumulative = 0;
  const bidLevels = bids.map((bid) => {
    bidCumulative += bid.size;
    const distancePercent =
      bestBid !== null && bestBid > 0
        ? ((bestBid - bid.price) / bestBid) * 100
        : 0;
    return {
      price: bid.price,
      cumulative_size: bidCumulative,
      price_distance_percent: distancePercent,
    };
  });

  // Calculate optimal trade size (size with < 1% price impact)
  let optimalTradeSize = 0;
  for (const level of askLevels) {
    if (level.price_distance_percent < 1) {
      optimalTradeSize = level.cumulative_size;
    } else {
      break;
    }
  }

  // Recommended max trade (95% of depth within 2%)
  const recommendedMaxTrade = Math.min(
    liquidity.depth_2_percent.ask_depth * 0.95,
    liquidity.depth_2_percent.bid_depth * 0.95
  );

  // Liquidity score (0-100) based on spread and depth
  let liquidityScore = 50;
  if (spread.spread_percentage !== null) {
    // Lower spread = higher score
    const spreadScore = Math.max(0, 100 - spread.spread_percentage * 10);
    // Higher depth = higher score (normalized)
    const depthScore = Math.min(
      100,
      (liquidity.depth_2_percent.ask_depth +
        liquidity.depth_2_percent.bid_depth) /
        1000
    );
    liquidityScore = (spreadScore + depthScore) / 2;
  }

  return {
    best_ask: bestAsk,
    best_bid: bestBid,
    spread: spread.spread_absolute,
    ask_levels: askLevels,
    bid_levels: bidLevels,
    total_ask_size: liquidity.total_ask_liquidity,
    total_bid_size: liquidity.total_bid_liquidity,
    optimal_trade_size: optimalTradeSize,
    recommended_max_trade: recommendedMaxTrade,
    liquidity_score: Math.round(liquidityScore),
  };
}

/**
 * Track orderbook changes over time
 */
export interface OrderbookChange {
  timestamp: number;
  spread_change: number;
  liquidity_change: number;
  price_change: number;
  significant_change: boolean;
}

export function analyzeOrderbookChanges(
  snapshots: ParsedOrderbook[]
): OrderbookChange[] {
  if (snapshots.length < 2) return [];

  const changes: OrderbookChange[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];

    const spreadChange = curr.spread - prev.spread;
    const priceChange =
      prev.midPrice !== null && curr.midPrice !== null
        ? ((curr.midPrice - prev.midPrice) / prev.midPrice) * 100
        : 0;

    // Calculate liquidity change
    const prevLiquidity =
      prev.asks.reduce((s, a) => s + a.size, 0) +
      prev.bids.reduce((s, b) => s + b.size, 0);
    const currLiquidity =
      curr.asks.reduce((s, a) => s + a.size, 0) +
      curr.bids.reduce((s, b) => s + b.size, 0);
    const liquidityChange =
      prevLiquidity > 0
        ? ((currLiquidity - prevLiquidity) / prevLiquidity) * 100
        : 0;

    // Significant change if spread changed > 10%, price > 1%, or liquidity > 20%
    const significantChange =
      Math.abs(spreadChange) > prev.spread * 0.1 ||
      Math.abs(priceChange) > 1 ||
      Math.abs(liquidityChange) > 20;

    changes.push({
      timestamp: curr.timestamp,
      spread_change: spreadChange,
      liquidity_change: liquidityChange,
      price_change: priceChange,
      significant_change: significantChange,
    });
  }

  return changes;
}
