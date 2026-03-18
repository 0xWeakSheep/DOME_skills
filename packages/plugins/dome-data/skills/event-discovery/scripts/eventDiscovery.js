/**
 * Event Discovery module for DOME Polymarket API.
 *
 * This module provides functions for discovering, filtering, and analyzing
 * Polymarket events through the DOME API.
 */
const BASE_URL = "https://api.domeapi.io/v1";
/** Custom error classes for DOME API */
export class DomeAPIError extends Error {
    constructor(message) {
        super(message);
        this.name = "DomeAPIError";
    }
}
export class DomeAPIRateLimitError extends DomeAPIError {
    constructor(message = "Rate limit exceeded") {
        super(message);
        this.name = "DomeAPIRateLimitError";
    }
}
export class DomeAPIValidationError extends DomeAPIError {
    constructor(message) {
        super(message);
        this.name = "DomeAPIValidationError";
    }
}
/**
 * Make a request to the DOME API
 */
async function makeRequest(endpoint, params, apiKey) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null)
            return;
        if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
        }
        else {
            url.searchParams.set(key, String(value));
        }
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
    if (response.status === 400) {
        const errorData = (await response.json().catch(() => ({})));
        throw new DomeAPIValidationError(errorData.message || "Invalid parameters");
    }
    if (response.status === 500) {
        throw new DomeAPIError("Internal server error");
    }
    if (!response.ok) {
        throw new DomeAPIError(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Fetch events from DOME API with optional filtering
 */
export async function fetchEvents(apiKey, params = {}) {
    const { event_slug, tags, status, include_markets, start_time, end_time, game_start_time, limit = 10, pagination_key, } = params;
    if (limit < 1 || limit > 100) {
        throw new DomeAPIValidationError("limit must be between 1 and 100");
    }
    const queryParams = { limit };
    if (event_slug)
        queryParams.event_slug = event_slug;
    if (tags)
        queryParams.tags = tags;
    if (status)
        queryParams.status = status;
    if (include_markets !== undefined)
        queryParams.include_markets = include_markets ? "true" : "false";
    if (start_time)
        queryParams.start_time = start_time;
    if (end_time)
        queryParams.end_time = end_time;
    if (game_start_time)
        queryParams.game_start_time = game_start_time;
    if (pagination_key)
        queryParams.pagination_key = pagination_key;
    return makeRequest("/polymarket/events", queryParams, apiKey);
}
/**
 * Fetch all events with automatic pagination
 */
export async function fetchAllEvents(apiKey, params = {}) {
    const { maxPages = 10, delayMs = 500, ...filters } = params;
    const allEvents = [];
    let paginationKey;
    let pagesFetched = 0;
    while (pagesFetched < maxPages) {
        const result = await fetchEvents(apiKey, {
            ...filters,
            limit: 100,
            pagination_key: paginationKey,
        });
        allEvents.push(...result.events);
        if (!result.pagination.has_more || !result.pagination.pagination_key) {
            break;
        }
        paginationKey = result.pagination.pagination_key;
        pagesFetched++;
        if (pagesFetched < maxPages && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return allEvents;
}
/**
 * Normalize and extract key fields from event data
 */
export function parseEventData(event) {
    return {
        event_slug: event.event_slug || "",
        title: event.title || "",
        subtitle: event.subtitle ?? null,
        status: event.status || "open",
        start_time: event.start_time || 0,
        end_time: event.end_time || 0,
        volume_fiat_amount: event.volume_fiat_amount || 0,
        settlement_sources: event.settlement_sources ?? null,
        rules_url: event.rules_url ?? null,
        image: event.image ?? null,
        tags: event.tags || [],
        market_count: event.market_count || 0,
        markets: event.markets || [],
    };
}
/**
 * Filter events suitable for analysis
 */
export function filterHighVolumeEvents(events, options = {}) {
    const { minVolume = 100000, status, tags, minMarkets = 0, } = options;
    return events.filter((event) => {
        // Check volume requirement
        const volume = event.volume_fiat_amount || 0;
        if (volume < minVolume)
            return false;
        // Check status requirement
        if (status && event.status !== status)
            return false;
        // Check markets count requirement
        if ((event.market_count || 0) < minMarkets)
            return false;
        // Check tags requirement
        if (tags && tags.length > 0) {
            const eventTags = event.tags || [];
            const hasMatchingTag = tags.some((tag) => eventTags.some((eventTag) => eventTag.toLowerCase().includes(tag.toLowerCase())));
            if (!hasMatchingTag)
                return false;
        }
        return true;
    });
}
/**
 * Get a single event by slug
 */
export async function fetchEventBySlug(apiKey, eventSlug) {
    const result = await fetchEvents(apiKey, {
        event_slug: eventSlug,
        include_markets: true,
        limit: 1,
    });
    return result.events[0] || null;
}
/**
 * Get markets from an event
 */
export function getEventMarkets(event) {
    if (!event.markets || !Array.isArray(event.markets)) {
        return [];
    }
    return event.markets;
}
export function calculateEventStats(event) {
    const markets = getEventMarkets(event);
    const openMarkets = markets.filter((m) => m.status === "open").length;
    const closedMarkets = markets.filter((m) => m.status === "closed").length;
    return {
        total_volume: event.volume_fiat_amount || 0,
        total_markets: event.market_count || 0,
        avg_volume_per_market: event.market_count > 0
            ? (event.volume_fiat_amount || 0) / event.market_count
            : 0,
        open_markets: openMarkets,
        closed_markets: closedMarkets,
        tags: event.tags || [],
    };
}
//# sourceMappingURL=eventDiscovery.js.map