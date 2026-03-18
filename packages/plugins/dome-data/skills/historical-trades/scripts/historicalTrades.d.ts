/**
 * Historical Trades module for DOME Polymarket API.
 *
 * This module provides functions for fetching and analyzing
 * historical trade data from Polymarket through the DOME API.
 */
/** Custom error for validation failures */
export declare class ValidationError extends Error {
    constructor(message: string);
}
/** Trade data structure from API */
export interface Trade {
    token_id: string;
    token_label: string;
    side: "BUY" | "SELL";
    market_slug: string;
    condition_id: string;
    shares: number;
    shares_normalized: number;
    price: number;
    block_number: number;
    log_index: number;
    tx_hash: string;
    title: string;
    timestamp: number;
    order_hash: string;
    user: string;
    taker: string;
}
/** Pagination information */
export interface Pagination {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
    pagination_key?: string;
}
/** API response for trades */
export interface TradesResponse {
    orders: Trade[];
    pagination: Pagination;
}
/** Parameters for fetching trades */
export interface FetchTradesParams {
    market_slug?: string;
    condition_id?: string;
    token_id?: string;
    user?: string;
    start_time?: number | Date;
    end_time?: number | Date;
    limit?: number;
    pagination_key?: string;
}
/**
 * Fetch trades from DOME API
 */
export declare function fetchTrades(apiKey: string, params: FetchTradesParams): Promise<TradesResponse>;
/**
 * Fetch all trades with automatic pagination
 */
export declare function fetchAllTrades(apiKey: string, params: Omit<FetchTradesParams, "pagination_key"> & {
    maxTrades?: number;
}): Promise<Trade[]>;
/**
 * Parse and normalize trade data
 */
export declare function parseTradeData(trade: Partial<Trade>): ParsedTrade;
/** Parsed trade data structure */
export interface ParsedTrade {
    token_id: string | null;
    token_label: string | null;
    side: "BUY" | "SELL" | null;
    market_slug: string | null;
    condition_id: string | null;
    shares: number | null;
    shares_normalized: number | null;
    price: number | null;
    timestamp: number | null;
    user: string | null;
    tx_hash: string | null;
    block_number: number | null;
    title: string | null;
    order_hash: string | null;
    taker: string | null;
}
/** Trade statistics */
export interface TradeStats {
    total_trades: number;
    total_volume: number;
    total_shares: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    buy_count: number;
    sell_count: number;
    buy_sell_ratio: number | null;
    buy_volume: number;
    sell_volume: number;
}
/**
 * Calculate statistics from trades
 */
export declare function calculateTradeStats(trades: Partial<Trade>[]): TradeStats;
/** Time bucket data */
export interface TimeBucket {
    start_time: number;
    end_time: number;
    count: number;
    buy_count: number;
    sell_count: number;
    volume: number;
    shares: number;
    avg_price: number;
    min_price: number;
    max_price: number;
}
/**
 * Aggregate trades by time intervals
 */
export declare function aggregateTradesByTime(trades: Partial<Trade>[], intervalSeconds: number): Record<number, TimeBucket>;
//# sourceMappingURL=historicalTrades.d.ts.map