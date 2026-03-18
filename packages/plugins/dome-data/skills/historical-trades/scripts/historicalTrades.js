/**
 * Historical Trades module for DOME Polymarket API.
 *
 * This module provides functions for fetching and analyzing
 * historical trade data from Polymarket through the DOME API.
 */
const BASE_URL = "https://api.domeapi.io/v1";
const ORDERS_ENDPOINT = "/polymarket/orders";
/** Custom error for validation failures */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
/**
 * Convert time parameter to Unix timestamp
 */
function normalizeTime(time) {
    if (time === undefined)
        return undefined;
    if (time instanceof Date)
        return Math.floor(time.getTime() / 1000);
    return time;
}
/**
 * Validate that only one of market_slug, token_id, or condition_id is provided
 */
function validateExclusiveFilters(params) {
    const filters = [params.market_slug, params.token_id, params.condition_id].filter((f) => f !== undefined);
    if (filters.length > 1) {
        throw new ValidationError("Only one of market_slug, token_id, or condition_id can be provided");
    }
    if (filters.length === 0) {
        throw new ValidationError("At least one of market_slug, token_id, or condition_id must be provided");
    }
}
/**
 * Fetch trades from DOME API
 */
export async function fetchTrades(apiKey, params) {
    validateExclusiveFilters(params);
    const { market_slug, condition_id, token_id, user, start_time, end_time, limit = 100, pagination_key, } = params;
    // Validate limit
    if (limit < 1 || limit > 1000) {
        throw new ValidationError("limit must be between 1 and 1000");
    }
    const queryParams = new URLSearchParams();
    queryParams.set("limit", String(limit));
    if (market_slug)
        queryParams.set("market_slug", market_slug);
    if (condition_id)
        queryParams.set("condition_id", condition_id);
    if (token_id)
        queryParams.set("token_id", token_id);
    if (user)
        queryParams.set("user", user);
    const normalizedStart = normalizeTime(start_time);
    const normalizedEnd = normalizeTime(end_time);
    if (normalizedStart !== undefined)
        queryParams.set("start_time", String(normalizedStart));
    if (normalizedEnd !== undefined)
        queryParams.set("end_time", String(normalizedEnd));
    if (pagination_key)
        queryParams.set("pagination_key", pagination_key);
    const url = `${BASE_URL}${ORDERS_ENDPOINT}?${queryParams.toString()}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Fetch all trades with automatic pagination
 */
export async function fetchAllTrades(apiKey, params) {
    const { maxTrades, ...baseParams } = params;
    const allTrades = [];
    let paginationKey;
    while (true) {
        const result = await fetchTrades(apiKey, {
            ...baseParams,
            limit: 1000,
            pagination_key: paginationKey,
        });
        allTrades.push(...result.orders);
        // Check if we've reached max_trades
        if (maxTrades !== undefined && allTrades.length >= maxTrades) {
            return allTrades.slice(0, maxTrades);
        }
        if (!result.pagination.has_more || !result.pagination.pagination_key) {
            break;
        }
        paginationKey = result.pagination.pagination_key;
    }
    return allTrades;
}
/**
 * Parse and normalize trade data
 */
export function parseTradeData(trade) {
    return {
        token_id: trade.token_id || null,
        token_label: trade.token_label || null,
        side: trade.side || null,
        market_slug: trade.market_slug || null,
        condition_id: trade.condition_id || null,
        shares: trade.shares ?? null,
        shares_normalized: trade.shares_normalized ?? null,
        price: trade.price ?? null,
        timestamp: trade.timestamp ?? null,
        user: trade.user || null,
        tx_hash: trade.tx_hash || null,
        block_number: trade.block_number ?? null,
        title: trade.title || null,
        order_hash: trade.order_hash || null,
        taker: trade.taker || null,
    };
}
/**
 * Calculate statistics from trades
 */
export function calculateTradeStats(trades) {
    if (trades.length === 0) {
        return {
            total_trades: 0,
            total_volume: 0,
            total_shares: 0,
            avg_price: 0,
            min_price: 0,
            max_price: 0,
            buy_count: 0,
            sell_count: 0,
            buy_sell_ratio: 0,
            buy_volume: 0,
            sell_volume: 0,
            sentiment: "neutral",
        };
    }
    let totalVolume = 0;
    let totalShares = 0;
    let priceSum = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let buyCount = 0;
    let sellCount = 0;
    let buyVolume = 0;
    let sellVolume = 0;
    for (const trade of trades) {
        const shares = trade.shares_normalized ?? 0;
        const price = trade.price ?? 0;
        const volume = shares * price;
        totalVolume += volume;
        totalShares += shares;
        priceSum += price;
        if (price > 0) {
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
        }
        const side = trade.side?.toUpperCase();
        if (side === "BUY") {
            buyCount++;
            buyVolume += volume;
        }
        else if (side === "SELL") {
            sellCount++;
            sellVolume += volume;
        }
    }
    const avgPrice = priceSum / trades.length;
    let buySellRatio = null;
    if (sellCount > 0) {
        buySellRatio = buyCount / sellCount;
    }
    else if (buyCount > 0) {
        buySellRatio = null; // Can't divide by zero
    }
    // Determine sentiment based on buy/sell ratio and volume
    let sentiment = "neutral";
    if (buySellRatio !== null) {
        if (buySellRatio > 1.2) {
            sentiment = "bullish";
        }
        else if (buySellRatio < 0.8) {
            sentiment = "bearish";
        }
    }
    return {
        total_trades: trades.length,
        total_volume: totalVolume,
        total_shares: totalShares,
        avg_price: avgPrice,
        min_price: minPrice === Infinity ? 0 : minPrice,
        max_price: maxPrice === -Infinity ? 0 : maxPrice,
        buy_count: buyCount,
        sell_count: sellCount,
        buy_sell_ratio: buySellRatio,
        buy_volume: buyVolume,
        sell_volume: sellVolume,
        sentiment,
    };
}
/**
 * Aggregate trades by time intervals
 */
export function aggregateTradesByTime(trades, intervalSeconds) {
    const buckets = {};
    for (const trade of trades) {
        const timestamp = trade.timestamp;
        if (!timestamp)
            continue;
        const bucketStart = Math.floor(timestamp / intervalSeconds) * intervalSeconds;
        if (!buckets[bucketStart]) {
            buckets[bucketStart] = {
                start_time: bucketStart,
                end_time: bucketStart + intervalSeconds - 1,
                count: 0,
                buy_count: 0,
                sell_count: 0,
                volume: 0,
                shares: 0,
                avg_price: 0,
                min_price: Infinity,
                max_price: -Infinity,
            };
        }
        const bucket = buckets[bucketStart];
        const shares = trade.shares_normalized ?? 0;
        const price = trade.price ?? 0;
        const volume = shares * price;
        bucket.count++;
        bucket.volume += volume;
        bucket.shares += shares;
        if (price > 0) {
            bucket.min_price = Math.min(bucket.min_price, price);
            bucket.max_price = Math.max(bucket.max_price, price);
        }
        const side = trade.side?.toUpperCase();
        if (side === "BUY") {
            bucket.buy_count++;
        }
        else if (side === "SELL") {
            bucket.sell_count++;
        }
    }
    // Calculate average prices
    for (const bucket of Object.values(buckets)) {
        if (bucket.count > 0) {
            bucket.avg_price = bucket.volume / bucket.shares;
        }
        if (bucket.min_price === Infinity)
            bucket.min_price = 0;
        if (bucket.max_price === -Infinity)
            bucket.max_price = 0;
    }
    return buckets;
}
//# sourceMappingURL=historicalTrades.js.map