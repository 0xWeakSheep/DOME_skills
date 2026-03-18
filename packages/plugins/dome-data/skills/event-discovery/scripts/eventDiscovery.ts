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

import { sanitizeString, sanitizeStringArray } from "./security.js";

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

export class DomeAPIValidationError extends DomeAPIError {
  constructor(message: string) {
    super(message);
    this.name = "DomeAPIValidationError";
  }
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
 * Make a request to the DOME API
 */
async function makeRequest(
  endpoint: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
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
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new DomeAPIValidationError(
      errorData.message || "Invalid parameters"
    );
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
export async function fetchEvents(
  apiKey: string,
  params: FetchEventsParams = {}
): Promise<EventsResponse> {
  const {
    event_slug,
    tags,
    status,
    include_markets,
    start_time,
    end_time,
    game_start_time,
    limit = 10,
    pagination_key,
  } = params;

  if (limit < 1 || limit > 100) {
    throw new DomeAPIValidationError("limit must be between 1 and 100");
  }

  const queryParams: Record<string, unknown> = { limit };

  if (event_slug) queryParams.event_slug = event_slug;
  if (tags) queryParams.tags = tags;
  if (status) queryParams.status = status;
  if (include_markets !== undefined)
    queryParams.include_markets = include_markets ? "true" : "false";
  if (start_time) queryParams.start_time = start_time;
  if (end_time) queryParams.end_time = end_time;
  if (game_start_time) queryParams.game_start_time = game_start_time;
  if (pagination_key) queryParams.pagination_key = pagination_key;

  return makeRequest("/polymarket/events", queryParams, apiKey) as Promise<EventsResponse>;
}

/**
 * Fetch all events with automatic pagination
 */
export async function fetchAllEvents(
  apiKey: string,
  params: Omit<FetchEventsParams, "pagination_key" | "limit"> & {
    maxPages?: number;
    delayMs?: number;
  } = {}
): Promise<Event[]> {
  const { maxPages = 10, delayMs = 500, ...filters } = params;

  const allEvents: Event[] = [];
  let paginationKey: string | undefined;
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
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parseEventData(event: Partial<Event>): ParsedEvent {
  return {
    event_slug: event.event_slug || "",
    title: sanitizeString(event.title, 500) || "",
    subtitle: sanitizeString(event.subtitle, 1000),
    status: event.status || "open",
    start_time: event.start_time || 0,
    end_time: event.end_time || 0,
    volume_fiat_amount: event.volume_fiat_amount || 0,
    settlement_sources: sanitizeString(event.settlement_sources, 1000),
    rules_url: event.rules_url ?? null,
    image: event.image ?? null,
    tags: sanitizeStringArray(event.tags, 50),
    market_count: event.market_count || 0,
    markets: event.markets || [],
  };
}

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
export function filterHighVolumeEvents(
  events: Partial<Event>[],
  options: {
    minVolume?: number;
    status?: EventStatus;
    tags?: string[];
    minMarkets?: number;
  } = {}
): Partial<Event>[] {
  const {
    minVolume = 100000,
    status,
    tags,
    minMarkets = 0,
  } = options;

  return events.filter((event) => {
    // Check volume requirement
    const volume = event.volume_fiat_amount || 0;
    if (volume < minVolume) return false;

    // Check status requirement
    if (status && event.status !== status) return false;

    // Check markets count requirement
    if ((event.market_count || 0) < minMarkets) return false;

    // Check tags requirement
    if (tags && tags.length > 0) {
      const eventTags = event.tags || [];
      const hasMatchingTag = tags.some((tag) =>
        eventTags.some((eventTag) =>
          eventTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  });
}

/**
 * Get a single event by slug
 */
export async function fetchEventBySlug(
  apiKey: string,
  eventSlug: string
): Promise<Event | null> {
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
export function getEventMarkets(event: Event): EventMarket[] {
  if (!event.markets || !Array.isArray(event.markets)) {
    return [];
  }
  return event.markets;
}

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

export function calculateEventStats(event: Event): EventStats {
  const markets = getEventMarkets(event);
  const openMarkets = markets.filter((m) => m.status === "open").length;
  const closedMarkets = markets.filter((m) => m.status === "closed").length;

  return {
    total_volume: event.volume_fiat_amount || 0,
    total_markets: event.market_count || 0,
    avg_volume_per_market:
      event.market_count > 0
        ? (event.volume_fiat_amount || 0) / event.market_count
        : 0,
    open_markets: openMarkets,
    closed_markets: closedMarkets,
    tags: event.tags || [],
  };
}
