/**
 * Candlestick Analysis module for DOME Polymarket API.
 *
 * This module provides functions for fetching and analyzing
 * candlestick data from Polymarket through the DOME API.
 */
/** Interval limits in seconds */
export declare const INTERVAL_LIMITS: Record<number, number>;
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
export declare class ValidationError extends Error {
    constructor(message: string);
}
/**
 * Get human-readable interval name
 */
export declare function getIntervalName(interval: number): string;
/**
 * Validate time range for interval
 */
export declare function validateTimeRange(startTime: number, endTime: number, interval: number): void;
/**
 * Fetch candlesticks from DOME API
 */
export declare function fetchCandlesticks(apiKey: string, conditionId: string, startTime: number, endTime: number, interval?: Interval): Promise<CandlestickSeries[]>;
/**
 * Parse candlestick data from API response
 */
export declare function parseCandlestickData(response: CandlesticksResponse): CandlestickSeries[];
/**
 * Calculate Simple Moving Average
 */
export declare function calculateSMA(prices: number[], period: number): (number | null)[];
/**
 * Calculate Exponential Moving Average
 */
export declare function calculateEMA(prices: number[], period: number): (number | null)[];
/**
 * Calculate volatility (standard deviation)
 */
export declare function calculateVolatility(prices: number[], period: number): (number | null)[];
/** Trend detection result */
export interface TrendResult {
    trend: "up" | "down" | "sideways" | "unknown";
    trend_strength: number;
    support_levels: number[];
    resistance_levels: number[];
    price_range: {
        min: number;
        max: number;
    };
}
/**
 * Detect price trends, support and resistance levels
 */
export declare function detectPriceTrends(candlesticks: Candlestick[], supportResistanceWindow?: number): TrendResult;
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
export declare function formatCandlestickSummary(series: CandlestickSeries): CandlestickSummary;
export {};
//# sourceMappingURL=candlestickAnalysis.d.ts.map