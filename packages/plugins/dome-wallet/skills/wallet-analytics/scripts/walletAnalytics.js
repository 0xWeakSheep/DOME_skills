/**
 * Wallet Analytics module for DOME Polymarket API.
 *
 * This module provides functions for analyzing wallet performance,
 * positions, and trading activity through the DOME API.
 *
 * SECURITY NOTE: All user-generated content from the DOME API is sanitized
 * using security utilities to mitigate indirect prompt injection risks (W011).
 * See security.ts for implementation details.
 */
import { sanitizeString } from "./security.js";
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
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null)
            return;
        url.searchParams.set(key, String(value));
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
    if (!response.ok) {
        throw new DomeAPIError(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Fetch wallet information
 */
export async function fetchWalletInfo(apiKey, params) {
    const { eoa, proxy, handle, with_metrics, start_time, end_time } = params;
    if (!eoa && !proxy && !handle) {
        throw new DomeAPIValidationError("Either eoa, proxy, or handle must be provided");
    }
    const queryParams = {};
    if (eoa)
        queryParams.eoa = eoa;
    if (proxy)
        queryParams.proxy = proxy;
    if (handle)
        queryParams.handle = handle;
    if (with_metrics)
        queryParams.with_metrics = "true";
    if (start_time)
        queryParams.start_time = start_time;
    if (end_time)
        queryParams.end_time = end_time;
    return makeRequest("/polymarket/wallet", queryParams, apiKey);
}
/**
 * Fetch positions for a wallet
 */
export async function fetchPositions(apiKey, walletAddress, params) {
    const { limit = 100, pagination_key } = params || {};
    const queryParams = { limit };
    if (pagination_key)
        queryParams.pagination_key = pagination_key;
    return makeRequest(`/polymarket/positions/wallet/${walletAddress}`, queryParams, apiKey);
}
/**
 * Fetch all positions with pagination
 */
export async function fetchAllPositions(apiKey, walletAddress, options) {
    const { maxPages = 10, delayMs = 500 } = options || {};
    const allPositions = [];
    let paginationKey;
    let pagesFetched = 0;
    while (pagesFetched < maxPages) {
        const result = await fetchPositions(apiKey, walletAddress, {
            limit: 100,
            pagination_key: paginationKey,
        });
        allPositions.push(...result.positions);
        if (!result.pagination.has_more || !result.pagination.pagination_key) {
            break;
        }
        paginationKey = result.pagination.pagination_key;
        pagesFetched++;
        if (pagesFetched < maxPages && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return allPositions;
}
/**
 * Fetch wallet PnL
 */
export async function fetchWalletPnL(apiKey, walletAddress, params) {
    const { granularity, start_time, end_time } = params;
    const queryParams = { granularity };
    if (start_time)
        queryParams.start_time = start_time;
    if (end_time)
        queryParams.end_time = end_time;
    return makeRequest(`/polymarket/wallet/pnl/${walletAddress}`, queryParams, apiKey);
}
/**
 * Parse wallet data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parseWalletData(wallet) {
    const metrics = wallet.wallet_metrics;
    return {
        eoa: wallet.eoa || "",
        proxy: wallet.proxy || "",
        wallet_type: wallet.wallet_type || "",
        handle: sanitizeString(wallet.handle, 100),
        pseudonym: sanitizeString(wallet.pseudonym, 100),
        image: wallet.image ?? null,
        total_volume: metrics?.total_volume || 0,
        total_trades: metrics?.total_trades || 0,
        total_markets: metrics?.total_markets || 0,
        merges: metrics?.merges || 0,
        splits: metrics?.splits || 0,
        conversions: metrics?.conversions || 0,
        redemptions: metrics?.redemptions || 0,
    };
}
/**
 * Parse position data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parsePositionData(position) {
    return {
        wallet: position.wallet || "",
        token_id: position.token_id || "",
        condition_id: position.condition_id ?? null,
        title: sanitizeString(position.title, 500),
        shares: position.shares || 0,
        shares_normalized: position.shares_normalized || 0,
        redeemable: position.redeemable || false,
        market_slug: position.market_slug ?? null,
        event_slug: position.event_slug ?? null,
        image: position.image ?? null,
        label: sanitizeString(position.label, 100),
        market_status: position.market_status || "open",
        end_time: position.end_time || 0,
    };
}
/**
 * Parse PnL data
 */
export function parsePnLData(pnl) {
    const periods = pnl.pnl_over_time || [];
    const pnls = periods.map((p) => p.pnl_to_date);
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    for (const pnlValue of pnls) {
        if (pnlValue > peak) {
            peak = pnlValue;
        }
        const drawdown = peak - pnlValue;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    return {
        granularity: pnl.granularity,
        start_time: pnl.start_time,
        end_time: pnl.end_time,
        wallet_address: pnl.wallet_address,
        pnl_over_time: periods,
        total_pnl: pnls.length > 0 ? pnls[pnls.length - 1] : 0,
        max_drawdown: maxDrawdown,
    };
}
/**
 * Calculate Sharpe ratio from returns
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0) {
    if (returns.length < 2)
        return null;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
        (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0)
        return 0;
    return (mean - riskFreeRate) / stdDev;
}
/**
 * Calculate trading performance metrics
 */
export function calculateTradingPerformance(pnlPeriods) {
    if (pnlPeriods.length === 0) {
        return {
            total_return: 0,
            max_drawdown: 0,
            win_rate: null,
            profitable_days: 0,
            losing_days: 0,
            sharpe_ratio: null,
            average_daily_return: 0,
            volatility: 0,
        };
    }
    const pnls = pnlPeriods.map((p) => p.pnl_to_date);
    const totalReturn = pnls[pnls.length - 1];
    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < pnls.length; i++) {
        const prev = pnls[i - 1];
        const curr = pnls[i];
        if (prev !== 0) {
            dailyReturns.push((curr - prev) / Math.abs(prev));
        }
        else {
            dailyReturns.push(curr > prev ? 1 : curr < prev ? -1 : 0);
        }
    }
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = pnls[0];
    for (const pnl of pnls) {
        if (pnl > peak) {
            peak = pnl;
        }
        const drawdown = peak - pnl;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    // Count profitable/losing periods
    let profitableDays = 0;
    let losingDays = 0;
    for (const ret of dailyReturns) {
        if (ret > 0)
            profitableDays++;
        else if (ret < 0)
            losingDays++;
    }
    const winRate = dailyReturns.length > 0
        ? profitableDays / (profitableDays + losingDays)
        : null;
    // Calculate average daily return and volatility
    const avgDailyReturn = dailyReturns.length > 0
        ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
        : 0;
    const volatility = dailyReturns.length > 1
        ? Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) /
            (dailyReturns.length - 1))
        : 0;
    // Calculate Sharpe ratio
    const sharpeRatio = calculateSharpeRatio(dailyReturns);
    return {
        total_return: totalReturn,
        max_drawdown: maxDrawdown,
        win_rate: winRate,
        profitable_days: profitableDays,
        losing_days: losingDays,
        sharpe_ratio: sharpeRatio,
        average_daily_return: avgDailyReturn,
        volatility,
    };
}
/**
 * Get position summary
 */
export function getPositionSummary(positions) {
    const openPositions = positions.filter((p) => p.market_status === "open");
    const closedPositions = positions.filter((p) => p.market_status === "closed");
    const redeemableCount = positions.filter((p) => p.redeemable).length;
    const totalShares = positions.reduce((sum, p) => sum + (p.shares_normalized || 0), 0);
    // Group by side
    const bySide = {};
    for (const position of positions) {
        const label = position.label || "Unknown";
        bySide[label] = (bySide[label] || 0) + 1;
    }
    return {
        total_positions: positions.length,
        open_positions: openPositions.length,
        closed_positions: closedPositions.length,
        total_shares: totalShares,
        by_side: bySide,
        redeemable_count: redeemableCount,
    };
}
export function analyzeSmartMoneyIndicators(wallet, performance) {
    // Volume percentile (simplified - would need population data)
    const volumePercentile = wallet.total_volume > 1000000 ? 95 : null;
    // Trade frequency score (0-100)
    const tradeFrequencyScore = Math.min(100, (wallet.total_trades / 100) * 100);
    // Consistency score based on win rate
    const consistencyScore = performance.win_rate
        ? performance.win_rate * 100
        : 50;
    // Risk management score (inverse of max drawdown relative to returns)
    const riskManagementScore = performance.total_return > 0 && performance.max_drawdown > 0
        ? Math.max(0, 100 - (performance.max_drawdown / performance.total_return) * 100)
        : 50;
    // Overall score (weighted average)
    const overallScore = tradeFrequencyScore * 0.2 +
        consistencyScore * 0.4 +
        riskManagementScore * 0.4;
    return {
        volume_percentile: volumePercentile,
        trade_frequency_score: tradeFrequencyScore,
        consistency_score: consistencyScore,
        risk_management_score: riskManagementScore,
        overall_score: overallScore,
    };
}
//# sourceMappingURL=walletAnalytics.js.map