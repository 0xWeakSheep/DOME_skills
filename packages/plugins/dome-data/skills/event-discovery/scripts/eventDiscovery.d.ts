/**
 * Event Discovery module for DOME Polymarket API.
 *
 * This module provides functions for discovering, filtering, and analyzing
 * Polymarket events through the DOME API.
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
/** Event status */
export type EventStatus = "open" | "closed";
/** Market within an event */
export interface EventMarket {
    market_slug: string;
    title: string;
    condition_id: string;
    status: EventStatus;
    volume_total: number;
}
/** Event data structure */
export interface Event {
    event_slug: string;
    title: string;
    subtitle: string | null;
    status: EventStatus;
    start_time: number;
    end_time: number;
    volume_fiat_amount: number;
    settlement_sources: string | null;
    rules_url: string | null;
    image: string | null;
    tags: string[];
    market_count: number;
    markets: EventMarket[] | null;
}
/** Pagination information */
export interface Pagination {
    limit: number;
    has_more: boolean;
    pagination_key?: string;
}
/** API response for events */
export interface EventsResponse {
    events: Event[];
    pagination: Pagination;
}
/** Parameters for fetching events */
export interface FetchEventsParams {
    event_slug?: string;
    tags?: string | string[];
    status?: EventStatus;
    include_markets?: boolean;
    start_time?: number;
    end_time?: number;
    game_start_time?: number;
    limit?: number;
    pagination_key?: string;
}
/**
 * Fetch events from DOME API with optional filtering
 */
export declare function fetchEvents(apiKey: string, params?: FetchEventsParams): Promise<EventsResponse>;
/**
 * Fetch all events with automatic pagination
 */
export declare function fetchAllEvents(apiKey: string, params?: Omit<FetchEventsParams, "pagination_key" | "limit"> & {
    maxPages?: number;
    delayMs?: number;
}): Promise<Event[]>;
/**
 * Normalize and extract key fields from event data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export declare function parseEventData(event: Partial<Event>): ParsedEvent;
/** Parsed event data structure */
export interface ParsedEvent {
    event_slug: string;
    title: string;
    subtitle: string | null;
    status: EventStatus;
    start_time: number;
    end_time: number;
    volume_fiat_amount: number;
    settlement_sources: string | null;
    rules_url: string | null;
    image: string | null;
    tags: string[];
    market_count: number;
    markets: EventMarket[];
}
/**
 * Filter events suitable for analysis
 */
export declare function filterHighVolumeEvents(events: Partial<Event>[], options?: {
    minVolume?: number;
    status?: EventStatus;
    tags?: string[];
    minMarkets?: number;
}): Partial<Event>[];
/**
 * Get a single event by slug
 */
export declare function fetchEventBySlug(apiKey: string, eventSlug: string): Promise<Event | null>;
/**
 * Get markets from an event
 */
export declare function getEventMarkets(event: Event): EventMarket[];
/**
 * Calculate event statistics
 */
export interface EventStats {
    total_volume: number;
    total_markets: number;
    avg_volume_per_market: number;
    open_markets: number;
    closed_markets: number;
    tags: string[];
}
export declare function calculateEventStats(event: Event): EventStats;
//# sourceMappingURL=eventDiscovery.d.ts.map