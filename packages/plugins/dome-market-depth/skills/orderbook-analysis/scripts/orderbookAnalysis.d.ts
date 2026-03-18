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
/** Custom error classes for DOME API */
export declare class DomeAPIError extends Error {
    constructor(message: string);
}
export declare class DomeAPIRateLimitError extends DomeAPIError {
    constructor(message?: string);
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
    imbalance: number;
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
    liquidity_score: number;
}
/**
 * Fetch orderbook history
 */
export declare function fetchOrderbookHistory(apiKey: string, tokenId: string, params?: {
    start_time?: number;
    end_time?: number;
    limit?: number;
    pagination_key?: string;
}): Promise<OrderbookResponse>;
/**
 * Fetch current market price
 */
export declare function fetchMarketPrice(apiKey: string, tokenId: string, at_time?: number): Promise<MarketPriceResponse>;
/**
 * Parse orderbook snapshot
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export declare function parseOrderbookSnapshot(snapshot: Partial<OrderbookSnapshot>): ParsedOrderbook;
/**
 * Calculate spread information
 */
export declare function calculateSpread(asks: BidAsk[], bids: BidAsk[]): SpreadInfo;
/**
 * Calculate weighted average price (VWAP)
 */
export declare function calculateWeightedAveragePrice(orders: BidAsk[]): number;
/**
 * Analyze liquidity
 */
export declare function analyzeLiquidity(asks: BidAsk[], bids: BidAsk[]): LiquidityAnalysis;
/**
 * Detect price impact for a trade
 */
export declare function detectPriceImpact(orders: BidAsk[], side: "buy" | "sell", tradeSize: number): PriceImpact;
/**
 * Get liquidity profile
 */
export declare function getLiquidityProfile(asks: BidAsk[], bids: BidAsk[]): LiquidityProfile;
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
export declare function analyzeOrderbookChanges(snapshots: ParsedOrderbook[]): OrderbookChange[];
export {};
//# sourceMappingURL=orderbookAnalysis.d.ts.map