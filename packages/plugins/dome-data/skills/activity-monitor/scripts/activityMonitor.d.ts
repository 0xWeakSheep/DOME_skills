/**
 * Activity Monitor module for DOME Polymarket API.
 *
 * This module provides functions for monitoring and analyzing
 * trading activity including MERGES, SPLITS, and REDEEMS.
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
/** Activity type */
export type ActivityType = "MERGE" | "SPLIT" | "REDEEM";
/** Activity data structure */
export interface Activity {
    token_id: string;
    side: ActivityType;
    type?: ActivityType;
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
}
/** Activity response */
export interface ActivityResponse {
    activities: Activity[];
    pagination: {
        limit: number;
        count: number;
        has_more: boolean;
        pagination_key?: string;
    };
}
/** Parsed activity data */
export interface ParsedActivity {
    token_id: string;
    side: ActivityType;
    market_slug: string | null;
    condition_id: string | null;
    shares: number;
    shares_normalized: number;
    price: number;
    block_number: number;
    tx_hash: string | null;
    title: string | null;
    timestamp: number;
    user: string | null;
}
/** Activity filter options */
export interface ActivityFilterOptions {
    types?: ActivityType[];
    minShares?: number;
    market_slug?: string;
    user?: string;
    start_time?: number;
    end_time?: number;
}
/** Large transaction tracker options */
export interface LargeTransactionOptions {
    threshold?: number;
    percentile?: number;
}
/** Activity cluster */
export interface ActivityCluster {
    start_time: number;
    end_time: number;
    activities: Activity[];
    total_shares: number;
    dominant_type: ActivityType;
}
/** Suspicious pattern */
export interface SuspiciousPattern {
    type: "high_frequency" | "large_volume" | "coordinated";
    description: string;
    activities: Activity[];
    severity: "low" | "medium" | "high";
}
/** Activity analysis result */
export interface ActivityAnalysis {
    total_count: number;
    total_shares: number;
    avg_shares_per_activity: number;
    type_distribution: Record<ActivityType, number>;
    time_range: {
        start: number | null;
        end: number | null;
    };
    clusters: ActivityCluster[];
    suspicious_patterns: SuspiciousPattern[];
    top_users: Array<{
        user: string;
        count: number;
        total_shares: number;
    }>;
}
/**
 * Fetch activity data
 */
export declare function fetchActivity(apiKey: string, params?: {
    user?: string;
    start_time?: number;
    end_time?: number;
    market_slug?: string;
    condition_id?: string;
    limit?: number;
    pagination_key?: string;
}): Promise<ActivityResponse>;
/**
 * Fetch all activity with pagination
 */
export declare function fetchAllActivity(apiKey: string, params?: {
    user?: string;
    start_time?: number;
    end_time?: number;
    market_slug?: string;
    condition_id?: string;
    maxPages?: number;
    delayMs?: number;
}): Promise<Activity[]>;
/**
 * Parse activity data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export declare function parseActivity(activity: Partial<Activity>): ParsedActivity;
/**
 * Filter merges, splits, and redeems
 */
export declare function filterMergesSplitsRedeems(activities: Activity[], options?: ActivityFilterOptions): Activity[];
/**
 * Track large transactions
 */
export declare function trackLargeTransactions(activities: Activity[], options?: LargeTransactionOptions): Activity[];
/**
 * Analyze activity patterns
 */
export declare function analyzeActivityPatterns(activities: Activity[], options?: {
    clusterWindowSeconds?: number;
}): ActivityAnalysis;
/**
 * Detect market closing signals
 */
export interface MarketClosingSignal {
    market_slug: string;
    confidence: number;
    signals: string[];
    redeem_count: number;
    total_redeem_shares: number;
}
export declare function detectMarketClosingSignals(activities: Activity[]): MarketClosingSignal[];
//# sourceMappingURL=activityMonitor.d.ts.map