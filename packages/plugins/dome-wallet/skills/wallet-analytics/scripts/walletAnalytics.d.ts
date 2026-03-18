/**
 * Wallet Analytics module for DOME Polymarket API.
 *
 * This module provides functions for analyzing wallet performance,
 * positions, and trading activity through the DOME API.
 */
/** Custom error classes for DOME API */
export declare class DomeAPIError extends Error {
    constructor(message: string);
}
export declare class DomeAPIRateLimitError extends DomeAPIError {
    constructor(message?: string);
}
export declare class DomeAPIValidationError extends DomeAPIError {
    constructor(message: string);
}
/** Wallet data structure */
export interface Wallet {
    eoa: string;
    proxy: string;
    wallet_type: string;
    handle: string | null;
    pseudonym: string | null;
    image: string | null;
    wallet_metrics?: {
        total_volume: number;
        total_trades: number;
        total_markets: number;
        highest_volume_day?: {
            date: string;
            volume: number;
            trades: number;
        };
        merges: number;
        splits: number;
        conversions: number;
        redemptions: number;
    };
}
/** Position data structure */
export interface Position {
    wallet: string;
    token_id: string;
    condition_id: string;
    title: string;
    shares: number;
    shares_normalized: number;
    redeemable: boolean;
    market_slug: string;
    event_slug: string;
    image: string;
    label: string;
    winning_outcome: {
        id: string;
        label: string;
    } | null;
    start_time: number;
    end_time: number;
    completed_time: number | null;
    close_time: number | null;
    game_start_time: string | null;
    market_status: "open" | "closed";
    negativeRisk: boolean;
}
/** Positions response */
export interface PositionsResponse {
    wallet_address: string;
    positions: Position[];
    pagination: {
        has_more: boolean;
        limit: number;
        pagination_key?: string;
    };
}
/** PnL period data */
export interface PnLPeriod {
    timestamp: number;
    pnl_to_date: number;
}
/** PnL data structure */
export interface PnLData {
    granularity: "day" | "week" | "month" | "year" | "all";
    start_time: number;
    end_time: number;
    wallet_address: string;
    pnl_over_time: PnLPeriod[];
}
/** Parsed wallet data */
export interface ParsedWallet {
    eoa: string;
    proxy: string;
    wallet_type: string;
    handle: string | null;
    pseudonym: string | null;
    image: string | null;
    total_volume: number;
    total_trades: number;
    total_markets: number;
    merges: number;
    splits: number;
    conversions: number;
    redemptions: number;
}
/** Parsed position data */
export interface ParsedPosition {
    wallet: string;
    token_id: string;
    condition_id: string | null;
    title: string | null;
    shares: number;
    shares_normalized: number;
    redeemable: boolean;
    market_slug: string | null;
    event_slug: string | null;
    image: string | null;
    label: string | null;
    market_status: "open" | "closed";
    end_time: number;
}
/** Parsed PnL data */
export interface ParsedPnL {
    granularity: string;
    start_time: number;
    end_time: number;
    wallet_address: string;
    pnl_over_time: PnLPeriod[];
    total_pnl: number;
    max_drawdown: number;
}
/** Trading performance metrics */
export interface TradingPerformance {
    total_return: number;
    max_drawdown: number;
    win_rate: number | null;
    profitable_days: number;
    losing_days: number;
    sharpe_ratio: number | null;
    average_daily_return: number;
    volatility: number;
}
/** Position summary */
export interface PositionSummary {
    total_positions: number;
    open_positions: number;
    closed_positions: number;
    total_shares: number;
    by_side: Record<string, number>;
    redeemable_count: number;
}
/**
 * Fetch wallet information
 */
export declare function fetchWalletInfo(apiKey: string, params: {
    eoa?: string;
    proxy?: string;
    handle?: string;
    with_metrics?: boolean;
    start_time?: number;
    end_time?: number;
}): Promise<Wallet>;
/**
 * Fetch positions for a wallet
 */
export declare function fetchPositions(apiKey: string, walletAddress: string, params?: {
    limit?: number;
    pagination_key?: string;
}): Promise<PositionsResponse>;
/**
 * Fetch all positions with pagination
 */
export declare function fetchAllPositions(apiKey: string, walletAddress: string, options?: {
    maxPages?: number;
    delayMs?: number;
}): Promise<Position[]>;
/**
 * Fetch wallet PnL
 */
export declare function fetchWalletPnL(apiKey: string, walletAddress: string, params: {
    granularity: "day" | "week" | "month" | "year" | "all";
    start_time?: number;
    end_time?: number;
}): Promise<PnLData>;
/**
 * Parse wallet data
 */
export declare function parseWalletData(wallet: Partial<Wallet>): ParsedWallet;
/**
 * Parse position data
 */
export declare function parsePositionData(position: Partial<Position>): ParsedPosition;
/**
 * Parse PnL data
 */
export declare function parsePnLData(pnl: PnLData): ParsedPnL;
/**
 * Calculate Sharpe ratio from returns
 */
export declare function calculateSharpeRatio(returns: number[], riskFreeRate?: number): number | null;
/**
 * Calculate trading performance metrics
 */
export declare function calculateTradingPerformance(pnlPeriods: PnLPeriod[]): TradingPerformance;
/**
 * Get position summary
 */
export declare function getPositionSummary(positions: Position[]): PositionSummary;
/**
 * Analyze smart money indicators
 */
export interface SmartMoneyIndicators {
    volume_percentile: number | null;
    trade_frequency_score: number;
    consistency_score: number;
    risk_management_score: number;
    overall_score: number;
}
export declare function analyzeSmartMoneyIndicators(wallet: ParsedWallet, performance: TradingPerformance): SmartMoneyIndicators;
//# sourceMappingURL=walletAnalytics.d.ts.map