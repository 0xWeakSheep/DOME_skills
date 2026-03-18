/**
 * Market Discovery module for DOME Polymarket API.
 *
 * This module provides functions for discovering, filtering, and analyzing
 * Polymarket markets through the DOME API.
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
export declare class DomeAPIValidationError extends DomeAPIError {
    constructor(message: string);
}
/** Market data structure */
export interface Market {
    market_slug: string;
    event_slug: string | null;
    condition_id: string;
    title: string;
    start_time: number;
    end_time: number;
    completed_time: number | null;
    close_time: number | null;
    status: "open" | "closed";
    tags: string[];
    volume_total: number;
    volume_1_week: number;
    volume_1_month: number;
    volume_1_year: number;
    image: string;
    description: string | null;
    side_a: {
        id: string;
        label: string;
    } | null;
    side_b: {
        id: string;
        label: string;
    } | null;
    winning_side: string | null;
    extra_fields: Record<string, unknown>;
}
/** Pagination information */
export interface Pagination {
    limit: number;
    total: number;
    has_more: boolean;
    pagination_key?: string;
}
/** API response for markets */
export interface MarketsResponse {
    markets: Market[];
    pagination: Pagination;
}
/** Parameters for fetching markets */
export interface FetchMarketsParams {
    market_slug?: string | string[];
    event_slug?: string | string[];
    condition_id?: string | string[];
    token_id?: string | string[];
    tags?: string | string[];
    search?: string;
    status?: "open" | "closed";
    min_volume?: number;
    start_time?: number;
    end_time?: number;
    limit?: number;
    pagination_key?: string;
}
/**
 * Fetch markets from DOME API with optional filtering
 */
export declare function fetchMarkets(apiKey: string, params?: FetchMarketsParams): Promise<MarketsResponse>;
/**
 * Fetch all markets with automatic pagination
 */
export declare function fetchAllMarkets(apiKey: string, params?: Omit<FetchMarketsParams, "pagination_key" | "limit"> & {
    maxPages?: number;
    delayMs?: number;
}): Promise<Market[]>;
/**
 * Normalize and extract key fields from market data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export declare function parseMarketData(market: Market): ParsedMarket;
/** Parsed market data structure */
export interface ParsedMarket {
    market_slug: string;
    event_slug: string | null;
    condition_id: string;
    title: string;
    description: string | null;
    start_time: number;
    end_time: number;
    close_time: number | null;
    completed_time: number | null;
    status: "open" | "closed";
    tags: string[];
    volume_total: number;
    volume_1_week: number;
    volume_1_month: number;
    volume_1_year: number;
    image: string;
    resolution_source: string | null;
    side_a: {
        token_id: string | null;
        label: string | null;
    };
    side_b: {
        token_id: string | null;
        label: string | null;
    };
    winning_side: string | null;
    extra_fields: Record<string, unknown>;
}
/**
 * Filter markets suitable for backtesting
 */
export declare function filterBacktestCandidates(markets: Market[], options?: {
    minVolume?: number;
    requireClosed?: boolean;
    minDurationHours?: number;
}): Market[];
/**
 * Search markets by keyword
 */
export declare function searchMarkets(apiKey: string, query: string, options?: {
    limit?: number;
    pagination_key?: string;
}): Promise<MarketsResponse>;
/**
 * Get a single market by condition ID
 */
export declare function getMarketByConditionId(apiKey: string, conditionId: string): Promise<Market | null>;
/**
 * Get a single market by slug
 */
export declare function getMarketBySlug(apiKey: string, marketSlug: string): Promise<Market | null>;
//# sourceMappingURL=marketDiscovery.d.ts.map