/**
 * Candlestick Analysis module for DOME Polymarket API.
 *
 * This module provides functions for fetching and analyzing
 * candlestick data from Polymarket through the DOME API.
 */

const BASE_URL = "https://api.domeapi.io/v1";

/** Interval limits in seconds */
export const INTERVAL_LIMITS: Record<number, number> = {
  1: 7 * 24 * 60 * 60, // 1m: 1 week
  60: 30 * 24 * 60 * 60, // 1h: 1 month
  1440: 365 * 24 * 60 * 60, // 1d: 1 year
};

/** Valid intervals */
export type Interval = 1 | 60 | 1440;

/** Candlestick data structure */
export interface Candlestick {
  end_period_ts: number;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  open_interest: number;
  yes_ask_open: number;
  yes_ask_close: number;
  yes_ask_high: number;
  yes_ask_low: number;
  yes_bid_open: number;
  yes_bid_close: number;
  yes_bid_high: number;
  yes_bid_low: number;
}

/** Token metadata */
export interface TokenMetadata {
  token_id: string;
  side: string;
}

/** Candlestick series for a token */
export interface CandlestickSeries {
  token_metadata: TokenMetadata;
  candlesticks: Candlestick[];
}

/** API response */
export interface CandlesticksResponse {
  candlesticks: [CandlestickData[], TokenMetadata][];
}

interface CandlestickData {
  end_period_ts: number;
  price: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  volume: number;
  open_interest: number;
  yes_ask: {
    open: number;
    close: number;
    high: number;
    low: number;
  };
  yes_bid: {
    open: number;
    close: number;
    high: number;
    low: number;
  };
}

/** Custom error for validation failures */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Get human-readable interval name
 */
export function getIntervalName(interval: number): string {
  switch (interval) {
    case 1:
      return "1 minute";
    case 60:
      return "1 hour";
    case 1440:
      return "1 day";
    default:
      return `${interval} minutes`;
  }
}

/**
 * Validate time range for interval
 */
export function validateTimeRange(
  startTime: number,
  endTime: number,
  interval: number
): void {
  if (!INTERVAL_LIMITS[interval]) {
    throw new ValidationError(
      `Invalid interval: ${interval}. Must be 1, 60, or 1440`
    );
  }

  if (startTime >= endTime) {
    throw new ValidationError("start_time must be before end_time");
  }

  const range = endTime - startTime;
  const maxRange = INTERVAL_LIMITS[interval];

  if (range > maxRange) {
    throw new ValidationError(
      `Time range ${range}s exceeds maximum ${maxRange}s for ${getIntervalName(
        interval
      )} interval`
    );
  }
}

/**
 * Fetch candlesticks from DOME API
 */
export async function fetchCandlesticks(
  apiKey: string,
  conditionId: string,
  startTime: number,
  endTime: number,
  interval: Interval = 1
): Promise<CandlestickSeries[]> {
  validateTimeRange(startTime, endTime, interval);

  const url = new URL(`${BASE_URL}/polymarket/candlesticks/${conditionId}`);
  url.searchParams.set("start_time", String(startTime));
  url.searchParams.set("end_time", String(endTime));
  url.searchParams.set("interval", String(interval));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as CandlesticksResponse;
  return parseCandlestickData(data);
}

/**
 * Parse candlestick data from API response
 */
export function parseCandlestickData(
  response: CandlesticksResponse
): CandlestickSeries[] {
  if (!response.candlesticks || !Array.isArray(response.candlesticks)) {
    return [];
  }

  const series: CandlestickSeries[] = [];

  for (const item of response.candlesticks) {
    if (!Array.isArray(item) || item.length !== 2) {
      continue;
    }

    const [candleDataArray, tokenMetadata] = item;

    if (!Array.isArray(candleDataArray) || typeof tokenMetadata !== "object") {
      continue;
    }

    const candles: Candlestick[] = candleDataArray.map((data) => ({
      end_period_ts: data.end_period_ts,
      open_price: data.price.open,
      high_price: data.price.high,
      low_price: data.price.low,
      close_price: data.price.close,
      volume: data.volume,
      open_interest: data.open_interest,
      yes_ask_open: data.yes_ask.open,
      yes_ask_close: data.yes_ask.close,
      yes_ask_high: data.yes_ask.high,
      yes_ask_low: data.yes_ask.low,
      yes_bid_open: data.yes_bid.open,
      yes_bid_close: data.yes_bid.close,
      yes_bid_high: data.yes_bid.high,
      yes_bid_low: data.yes_bid.low,
    }));

    series.push({
      token_metadata: {
        token_id: tokenMetadata.token_id,
        side: tokenMetadata.side,
      },
      candlesticks: candles,
    });
  }

  return series;
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): (number | null)[] {
  if (period <= 0) {
    throw new Error("Period must be positive");
  }

  const result: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }

  return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  if (period <= 0) {
    throw new Error("Period must be positive");
  }

  const result: (number | null)[] = new Array(prices.length).fill(null);
  const multiplier = 2 / (period + 1);

  // First EMA is SMA
  let ema =
    prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = ema;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
    result[i] = ema;
  }

  return result;
}

/**
 * Calculate volatility (standard deviation)
 */
export function calculateVolatility(
  prices: number[],
  period: number
): (number | null)[] {
  if (period <= 0) {
    throw new Error("Period must be positive");
  }

  const result: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance =
        slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
        period;
      result.push(Math.sqrt(variance));
    }
  }

  return result;
}

/** Trend detection result */
export interface TrendResult {
  trend: "up" | "down" | "sideways" | "unknown";
  trend_strength: number;
  support_levels: number[];
  resistance_levels: number[];
  price_range: { min: number; max: number };
}

/**
 * Detect price trends, support and resistance levels
 */
export function detectPriceTrends(
  candlesticks: Candlestick[],
  supportResistanceWindow: number = 5
): TrendResult {
  if (candlesticks.length < 2) {
    return {
      trend: "unknown",
      trend_strength: 0,
      support_levels: [],
      resistance_levels: [],
      price_range: { min: 0, max: 0 },
    };
  }

  const closes = candlesticks.map((c) => c.close_price);
  const highs = candlesticks.map((c) => c.high_price);
  const lows = candlesticks.map((c) => c.low_price);

  // Calculate price change
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const priceChange = lastPrice - firstPrice;
  const priceChangePct = priceChange / firstPrice;

  // Determine trend
  let trend: "up" | "down" | "sideways" = "sideways";
  if (priceChangePct > 0.05) trend = "up";
  else if (priceChangePct < -0.05) trend = "down";

  // Calculate trend strength (0-1)
  const trendStrength = Math.min(Math.abs(priceChangePct) * 10, 1);

  // Find support and resistance levels
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];

  for (let i = supportResistanceWindow; i < highs.length - supportResistanceWindow; i++) {
    // Check for local max (resistance)
    const isLocalMax = highs
      .slice(i - supportResistanceWindow, i + supportResistanceWindow + 1)
      .every((h) => h <= highs[i]);
    if (isLocalMax) resistanceLevels.push(highs[i]);

    // Check for local min (support)
    const isLocalMin = lows
      .slice(i - supportResistanceWindow, i + supportResistanceWindow + 1)
      .every((l) => l >= lows[i]);
    if (isLocalMin) supportLevels.push(lows[i]);
  }

  return {
    trend,
    trend_strength: trendStrength,
    support_levels: [...new Set(supportLevels)].sort((a, b) => a - b),
    resistance_levels: [...new Set(resistanceLevels)].sort((a, b) => a - b),
    price_range: {
      min: Math.min(...lows),
      max: Math.max(...highs),
    },
  };
}

/** Candlestick summary */
export interface CandlestickSummary {
  side: string;
  token_id: string;
  data_points: number;
  price_summary: {
    open: number;
    close: number;
    high: number;
    low: number;
    change_pct: number;
  };
  volume_summary: {
    total: number;
    avg: number;
    max: number;
    min: number;
  };
}

/**
 * Format candlestick series summary
 */
export function formatCandlestickSummary(
  series: CandlestickSeries
): CandlestickSummary {
  const candles = series.candlesticks;

  if (candles.length === 0) {
    return {
      side: series.token_metadata.side,
      token_id: series.token_metadata.token_id,
      data_points: 0,
      price_summary: { open: 0, close: 0, high: 0, low: 0, change_pct: 0 },
      volume_summary: { total: 0, avg: 0, max: 0, min: 0 },
    };
  }

  const prices = candles.map((c) => c.close_price);
  const volumes = candles.map((c) => c.volume);
  const firstPrice = candles[0].open_price;
  const lastPrice = candles[candles.length - 1].close_price;
  const priceChangePct = ((lastPrice - firstPrice) / firstPrice) * 100;

  return {
    side: series.token_metadata.side,
    token_id: series.token_metadata.token_id,
    data_points: candles.length,
    price_summary: {
      open: firstPrice,
      close: lastPrice,
      high: Math.max(...candles.map((c) => c.high_price)),
      low: Math.min(...candles.map((c) => c.low_price)),
      change_pct: priceChangePct,
    },
    volume_summary: {
      total: volumes.reduce((a, b) => a + b, 0),
      avg: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      max: Math.max(...volumes),
      min: Math.min(...volumes),
    },
  };
}
