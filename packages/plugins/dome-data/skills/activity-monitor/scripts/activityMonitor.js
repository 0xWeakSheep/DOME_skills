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
/**
 * Get activity type from activity object
 * Handles both 'type' and 'side' fields for API compatibility
 */
function getActivityType(activity) {
    return activity.type ?? activity.side ?? "MERGE";
}
/**
 * Make a request to the DOME API
 */
async function makeRequest(endpoint, params, apiKey) {
    const url = new URL(`${BASE_URL}${endpoint}`);
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
    if (!response.ok) {
        throw new DomeAPIError(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Fetch activity data
 */
export async function fetchActivity(apiKey, params) {
    const { user, start_time, end_time, market_slug, condition_id, limit = 100, pagination_key, } = params || {};
    if (limit < 1 || limit > 1000) {
        throw new DomeAPIError("limit must be between 1 and 1000");
    }
    const queryParams = { limit };
    if (user)
        queryParams.user = user;
    if (start_time)
        queryParams.start_time = start_time;
    if (end_time)
        queryParams.end_time = end_time;
    if (market_slug)
        queryParams.market_slug = market_slug;
    if (condition_id)
        queryParams.condition_id = condition_id;
    if (pagination_key)
        queryParams.pagination_key = pagination_key;
    return makeRequest("/polymarket/activity", queryParams, apiKey);
}
/**
 * Fetch all activity with pagination
 */
export async function fetchAllActivity(apiKey, params) {
    const { maxPages = 10, delayMs = 500, ...filters } = params || {};
    const allActivity = [];
    let paginationKey;
    let pagesFetched = 0;
    while (pagesFetched < maxPages) {
        const result = await fetchActivity(apiKey, {
            ...filters,
            limit: 1000,
            pagination_key: paginationKey,
        });
        allActivity.push(...result.activities);
        if (!result.pagination.has_more || !result.pagination.pagination_key) {
            break;
        }
        paginationKey = result.pagination.pagination_key;
        pagesFetched++;
        if (pagesFetched < maxPages && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return allActivity;
}
/**
 * Parse activity data
 *
 * SECURITY: All user-generated string fields are sanitized to prevent
 * indirect prompt injection attacks (Snyk W011).
 */
export function parseActivity(activity) {
    return {
        token_id: activity.token_id || "",
        side: getActivityType(activity),
        market_slug: activity.market_slug ?? null,
        condition_id: activity.condition_id ?? null,
        shares: activity.shares || 0,
        shares_normalized: activity.shares_normalized || 0,
        price: activity.price || 0,
        block_number: activity.block_number || 0,
        tx_hash: activity.tx_hash ?? null,
        title: sanitizeString(activity.title, 500),
        timestamp: activity.timestamp || 0,
        user: activity.user ?? null,
    };
}
/**
 * Filter merges, splits, and redeems
 */
export function filterMergesSplitsRedeems(activities, options = {}) {
    const { types, minShares, market_slug, user, start_time, end_time } = options;
    return activities.filter((activity) => {
        // Filter by activity type
        const activityType = getActivityType(activity);
        if (types && types.length > 0 && !types.includes(activityType)) {
            return false;
        }
        // Filter by minimum shares
        if (minShares !== undefined && activity.shares_normalized < minShares) {
            return false;
        }
        // Filter by market slug
        if (market_slug && activity.market_slug !== market_slug) {
            return false;
        }
        // Filter by user
        if (user && activity.user !== user) {
            return false;
        }
        // Filter by time range
        if (start_time && activity.timestamp < start_time) {
            return false;
        }
        if (end_time && activity.timestamp > end_time) {
            return false;
        }
        return true;
    });
}
/**
 * Track large transactions
 */
export function trackLargeTransactions(activities, options = {}) {
    const { threshold, percentile } = options;
    if (activities.length === 0)
        return [];
    // If threshold is specified, use it directly
    if (threshold !== undefined) {
        return activities.filter((a) => a.shares_normalized >= threshold);
    }
    // If percentile is specified, calculate threshold from data
    if (percentile !== undefined) {
        const sortedShares = activities
            .map((a) => a.shares_normalized)
            .sort((a, b) => a - b);
        const index = Math.floor((percentile / 100) * sortedShares.length);
        const calculatedThreshold = sortedShares[index] || 0;
        return activities.filter((a) => a.shares_normalized >= calculatedThreshold);
    }
    // Default: return top 10% by shares
    const sortedShares = activities
        .map((a) => a.shares_normalized)
        .sort((a, b) => a - b);
    const defaultIndex = Math.floor(0.9 * sortedShares.length);
    const defaultThreshold = sortedShares[defaultIndex] || 0;
    return activities.filter((a) => a.shares_normalized >= defaultThreshold);
}
/**
 * Analyze activity patterns
 */
export function analyzeActivityPatterns(activities, options) {
    if (activities.length === 0) {
        return {
            total_count: 0,
            total_shares: 0,
            avg_shares_per_activity: 0,
            type_distribution: { MERGE: 0, SPLIT: 0, REDEEM: 0 },
            time_range: { start: null, end: null },
            clusters: [],
            suspicious_patterns: [],
            top_users: [],
        };
    }
    const clusterWindow = options?.clusterWindowSeconds || 300; // 5 minutes default
    // Basic statistics
    const totalShares = activities.reduce((sum, a) => sum + a.shares_normalized, 0);
    const avgShares = totalShares / activities.length;
    // Type distribution
    const typeDistribution = {
        MERGE: 0,
        SPLIT: 0,
        REDEEM: 0,
    };
    for (const activity of activities) {
        const activityType = getActivityType(activity);
        typeDistribution[activityType]++;
    }
    // Time range
    const timestamps = activities.map((a) => a.timestamp);
    const startTime = Math.min(...timestamps);
    const endTime = Math.max(...timestamps);
    // Sort by timestamp for clustering
    const sortedActivities = [...activities].sort((a, b) => a.timestamp - b.timestamp);
    // Find clusters
    const clusters = [];
    let currentCluster = [];
    for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];
        if (currentCluster.length === 0) {
            currentCluster.push(activity);
        }
        else {
            const lastActivity = currentCluster[currentCluster.length - 1];
            if (activity.timestamp - lastActivity.timestamp <= clusterWindow) {
                currentCluster.push(activity);
            }
            else {
                // Save current cluster and start new one
                if (currentCluster.length >= 2) {
                    const clusterShares = currentCluster.reduce((sum, a) => sum + a.shares_normalized, 0);
                    const typeCounts = {};
                    for (const a of currentCluster) {
                        const activityType = getActivityType(a);
                        typeCounts[activityType] = (typeCounts[activityType] || 0) + 1;
                    }
                    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
                    clusters.push({
                        start_time: currentCluster[0].timestamp,
                        end_time: currentCluster[currentCluster.length - 1].timestamp,
                        activities: [...currentCluster],
                        total_shares: clusterShares,
                        dominant_type: dominantType,
                    });
                }
                currentCluster = [activity];
            }
        }
    }
    // Don't forget the last cluster
    if (currentCluster.length >= 2) {
        const clusterShares = currentCluster.reduce((sum, a) => sum + a.shares_normalized, 0);
        const typeCounts = {};
        for (const a of currentCluster) {
            const activityType = getActivityType(a);
            typeCounts[activityType] = (typeCounts[activityType] || 0) + 1;
        }
        const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
        clusters.push({
            start_time: currentCluster[0].timestamp,
            end_time: currentCluster[currentCluster.length - 1].timestamp,
            activities: [...currentCluster],
            total_shares: clusterShares,
            dominant_type: dominantType,
        });
    }
    // Identify suspicious patterns
    const suspiciousPatterns = [];
    // High frequency pattern (more than 10 activities in cluster window)
    for (const cluster of clusters) {
        if (cluster.activities.length >= 10) {
            suspiciousPatterns.push({
                type: "high_frequency",
                description: `High frequency activity: ${cluster.activities.length} activities in ${clusterWindow} seconds`,
                activities: cluster.activities,
                severity: cluster.activities.length >= 20 ? "high" : "medium",
            });
        }
    }
    // Large volume pattern (top 5% of activities by shares)
    const sortedByShares = [...activities].sort((a, b) => b.shares_normalized - a.shares_normalized);
    const top5PercentCount = Math.max(1, Math.floor(activities.length * 0.05));
    const largeVolumeActivities = sortedByShares.slice(0, top5PercentCount);
    if (largeVolumeActivities.length > 0) {
        const avgLargeShares = largeVolumeActivities.reduce((sum, a) => sum + a.shares_normalized, 0) /
            largeVolumeActivities.length;
        if (avgLargeShares > 1000) {
            suspiciousPatterns.push({
                type: "large_volume",
                description: `Large volume activity detected: ${largeVolumeActivities.length} transactions with avg ${avgLargeShares.toFixed(2)} shares`,
                activities: largeVolumeActivities,
                severity: avgLargeShares > 5000 ? "high" : "medium",
            });
        }
    }
    // Top users analysis
    const userStats = {};
    for (const activity of activities) {
        if (!userStats[activity.user]) {
            userStats[activity.user] = { count: 0, total_shares: 0 };
        }
        userStats[activity.user].count++;
        userStats[activity.user].total_shares += activity.shares_normalized;
    }
    const topUsers = Object.entries(userStats)
        .map(([user, stats]) => ({
        user,
        count: stats.count,
        total_shares: stats.total_shares,
    }))
        .sort((a, b) => b.total_shares - a.total_shares)
        .slice(0, 10);
    return {
        total_count: activities.length,
        total_shares: totalShares,
        avg_shares_per_activity: avgShares,
        type_distribution: typeDistribution,
        time_range: { start: startTime, end: endTime },
        clusters,
        suspicious_patterns: suspiciousPatterns,
        top_users: topUsers,
    };
}
export function detectMarketClosingSignals(activities) {
    const marketStats = {};
    for (const activity of activities) {
        const slug = activity.market_slug;
        if (!marketStats[slug]) {
            marketStats[slug] = {
                redeem_count: 0,
                total_redeem_shares: 0,
                other_count: 0,
                signals: [],
            };
        }
        const activityType = getActivityType(activity);
        if (activityType === "REDEEM") {
            marketStats[slug].redeem_count++;
            marketStats[slug].total_redeem_shares += activity.shares_normalized;
        }
        else {
            marketStats[slug].other_count++;
        }
    }
    const signals = [];
    for (const [market_slug, stats] of Object.entries(marketStats)) {
        // Build signals
        const signalList = [];
        let confidence = 0;
        if (stats.redeem_count > 5) {
            signalList.push("Multiple redemptions detected");
            confidence += 0.3;
        }
        if (stats.total_redeem_shares > 1000) {
            signalList.push("Large volume redemption");
            confidence += 0.3;
        }
        const redeemRatio = stats.redeem_count + stats.other_count > 0
            ? stats.redeem_count / (stats.redeem_count + stats.other_count)
            : 0;
        if (redeemRatio > 0.8) {
            signalList.push("High redemption ratio");
            confidence += 0.4;
        }
        if (signalList.length > 0) {
            signals.push({
                market_slug,
                confidence: Math.min(1, confidence),
                signals: signalList,
                redeem_count: stats.redeem_count,
                total_redeem_shares: stats.total_redeem_shares,
            });
        }
    }
    return signals.sort((a, b) => b.confidence - a.confidence);
}
//# sourceMappingURL=activityMonitor.js.map