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
  side_a: { id: string; label: string } | null;
  side_b: { id: string; label: string } | null;
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
 * Fetch markets from DOME API with optional filtering
 */
export async function fetchMarkets(
  apiKey: string,
  params: FetchMarketsParams = {}
): Promise<MarketsResponse> {
  const {
    market_slug,
    event_slug,
    condition_id,
    token_id,
    tags,
    search,
    status,
    min_volume,
    start_time,
    end_time,
    limit = 10,
    pagination_key,
  } = params;

  if (search && search.length < 2) {
    throw new DomeAPIValidationError(
      "Search query must be at least 2 characters"
    );
  }

  const queryParams: Record<string, unknown> = { limit };

  if (market_slug) queryParams.market_slug = market_slug;
  if (event_slug) queryParams.event_slug = event_slug;
  if (condition_id) queryParams.condition_id = condition_id;
  if (token_id) {
    // Limit to 100 token IDs
    const tokens = Array.isArray(token_id) ? token_id.slice(0, 100) : token_id;
    queryParams.token_id = tokens;
  }
  if (tags) queryParams.tags = tags;
  if (search) queryParams.search = search;
  if (status) queryParams.status = status;
  if (min_volume !== undefined) queryParams.min_volume = min_volume;
  if (start_time) queryParams.start_time = start_time;
  if (end_time) queryParams.end_time = end_time;
  if (pagination_key) queryParams.pagination_key = pagination_key;

  return makeRequest("/polymarket/markets", queryParams, apiKey) as Promise<MarketsResponse>;
}

/**
 * Fetch all markets with automatic pagination
 */
export async function fetchAllMarkets(
  apiKey: string,
  params: Omit<FetchMarketsParams, "pagination_key" | "limit"> & {
    maxPages?: number;
    delayMs?: number;
  } = {}
): Promise<Market[]> {
  const { maxPages = 10, delayMs = 500, ...filters } = params;

  const allMarkets: Market[] = [];
  let paginationKey: string | undefined;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const result = await fetchMarkets(apiKey, {
      ...filters,
      limit: 100,
      pagination_key: paginationKey,
    });

    allMarkets.push(...result.markets);

    if (!result.pagination.has_more || !result.pagination.pagination_key) {
      break;
    }

    paginationKey = result.pagination.pagination_key;
    pagesFetched++;

    if (pagesFetched < maxPages && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allMarkets;
}

/**
 * Normalize and extract key fields from market data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parseMarketData(market: Market): ParsedMarket {
  const sideA = market.side_a || { id: null, label: null };
  const sideB = market.side_b || { id: null, label: null };

  return {
    market_slug: market.market_slug,
    event_slug: market.event_slug,
    condition_id: market.condition_id,
    title: sanitizeString(market.title, 500) || "",
    description: sanitizeString(market.description, 2000),
    start_time: market.start_time,
    end_time: market.end_time,
    close_time: market.close_time,
    completed_time: market.completed_time,
    status: market.status,
    tags: sanitizeStringArray(market.tags, 50),
    volume_total: market.volume_total || 0,
    volume_1_week: market.volume_1_week || 0,
    volume_1_month: market.volume_1_month || 0,
    volume_1_year: market.volume_1_year || 0,
    image: market.image,
    resolution_source: sanitizeString(
      (market as unknown as Record<string, string>).resolution_source,
      500
    ),
    side_a: {
      token_id: sideA.id,
      label: sanitizeString(sideA.label, 100),
    },
    side_b: {
      token_id: sideB.id,
      label: sanitizeString(sideB.label, 100),
    },
    winning_side: sanitizeString(market.winning_side, 100),
    extra_fields: market.extra_fields || {},
  };
}

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
  side_a: { token_id: string | null; label: string | null };
  side_b: { token_id: string | null; label: string | null };
  winning_side: string | null;
  extra_fields: Record<string, unknown>;
}

/**
 * Filter markets suitable for backtesting
 */
export function filterBacktestCandidates(
  markets: Market[],
  options: {
    minVolume?: number;
    requireClosed?: boolean;
    minDurationHours?: number;
  } = {}
): Market[] {
  const { minVolume = 10000, requireClosed = false, minDurationHours = 24 } = options;

  return markets.filter((market) => {
    // Check volume requirement
    if ((market.volume_total || 0) < minVolume) return false;

    // Check status requirement
    if (requireClosed && market.status !== "closed") return false;

    // Check duration requirement
    if (market.start_time && market.end_time) {
      const durationHours = (market.end_time - market.start_time) / 3600;
      if (durationHours < minDurationHours) return false;
    }

    return true;
  });
}

/**
 * Search markets by keyword
 */
export async function searchMarkets(
  apiKey: string,
  query: string,
  status: "open" | "closed",
  options: { limit?: number; pagination_key?: string } = {}
): Promise<MarketsResponse> {
  if (query.length < 2) {
    throw new DomeAPIValidationError(
      "Search query must be at least 2 characters"
    );
  }

  // Note: Search endpoint requires status parameter
  const params: FetchMarketsParams = { search: query, status };
  if (options.pagination_key) {
    params.pagination_key = options.pagination_key;
  }
  if (options.limit) {
    params.limit = options.limit;
  }
  return fetchMarkets(apiKey, params);
}

/**
 * Get a single market by condition ID
 */
export async function getMarketByConditionId(
  apiKey: string,
  conditionId: string
): Promise<Market | null> {
  const result = await fetchMarkets(apiKey, {
    condition_id: conditionId,
    limit: 1,
  });

  return result.markets[0] || null;
}

/**
 * Get a single market by slug
 */
export async function getMarketBySlug(
  apiKey: string,
  marketSlug: string
): Promise<Market | null> {
  const result = await fetchMarkets(apiKey, {
    market_slug: marketSlug,
    limit: 1,
  });

  return result.markets[0] || null;
}
