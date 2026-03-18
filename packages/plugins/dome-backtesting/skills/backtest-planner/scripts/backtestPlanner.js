/**
 * Backtest Planner for DOME Polymarket Backtesting Workflows.
 *
 * This module provides utilities for planning and validating backtest parameters,
 * calculating data requirements, and generating comprehensive backtest plans.
 */
/** Interval limits in seconds */
export const INTERVAL_LIMITS = {
    "1m": 7 * 24 * 60 * 60, // 1 week
    "1h": 30 * 24 * 60 * 60, // 1 month
    "1d": 365 * 24 * 60 * 60, // 1 year
};
/** Valid strategy types */
export const VALID_STRATEGY_TYPES = [
    "event_driven",
    "price_driven",
    "momentum",
    "mean_reversion",
];
/** Custom error for validation failures */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
/** Custom error for data coverage issues */
export class DataCoverageError extends Error {
    constructor(message) {
        super(message);
        this.name = "DataCoverageError";
    }
}
/**
 * Parse time parameter to Date
 */
function parseTime(time) {
    if (time instanceof Date)
        return time;
    if (typeof time === "number")
        return new Date(time * 1000);
    return new Date(time);
}
/**
 * Validate backtest parameters
 */
export function validateBacktestParams(params) {
    const errors = [];
    // Check required fields
    const requiredFields = [
        "market_condition_id",
        "start_time",
        "end_time",
        "strategy_type",
    ];
    for (const field of requiredFields) {
        if (params[field] === undefined || params[field] === null) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    if (errors.length > 0) {
        return { is_valid: false, errors };
    }
    // Validate strategy type
    const strategyType = params.strategy_type;
    if (!VALID_STRATEGY_TYPES.includes(strategyType)) {
        errors.push(`Invalid strategy_type: '${strategyType}'. Must be one of: ${VALID_STRATEGY_TYPES.join(", ")}`);
    }
    // Parse and validate time range
    try {
        const startTime = parseTime(params.start_time);
        const endTime = parseTime(params.end_time);
        if (isNaN(startTime.getTime())) {
            errors.push("Invalid start_time format");
        }
        if (isNaN(endTime.getTime())) {
            errors.push("Invalid end_time format");
        }
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
            if (startTime >= endTime) {
                errors.push("start_time must be before end_time");
            }
            // Check interval limits
            const interval = params.interval || "1m";
            const rangeSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
            const maxRange = INTERVAL_LIMITS[interval];
            if (rangeSeconds > maxRange) {
                errors.push(`Time range ${Math.round(rangeSeconds / 86400)} days exceeds maximum ${Math.round(maxRange / 86400)} days for ${interval} interval`);
            }
        }
    }
    catch (e) {
        errors.push("Error parsing time parameters");
    }
    // Validate position_size if provided
    if (params.position_size !== undefined) {
        if (params.position_size < 0 || params.position_size > 1) {
            errors.push("position_size must be between 0 and 1");
        }
    }
    return {
        is_valid: errors.length === 0,
        errors,
    };
}
/**
 * Calculate data requirements for a backtest
 */
export function calculateDataRequirements(params) {
    const startTime = parseTime(params.start_time);
    const endTime = parseTime(params.end_time);
    const interval = params.interval || "1m";
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
    const durationDays = durationSeconds / (24 * 60 * 60);
    // Determine data requirements based on strategy
    const requiresTradeHistory = params.strategy_type === "event_driven";
    const requiresCandlesticks = ["price_driven", "momentum", "mean_reversion"].includes(params.strategy_type);
    // Calculate interval seconds
    const intervalSeconds = interval === "1m" ? 60 : interval === "1h" ? 60 * 60 : 24 * 60 * 60;
    // Estimate API calls (simplified)
    let estimatedApiCalls = 1;
    if (requiresCandlesticks) {
        // May need multiple calls if range exceeds limit
        const maxRange = INTERVAL_LIMITS[interval];
        estimatedApiCalls = Math.ceil(durationSeconds / maxRange) || 1;
    }
    if (requiresTradeHistory) {
        estimatedApiCalls += Math.ceil(durationDays / 7); // Trade history may need pagination
    }
    // Estimate data size (rough approximation)
    const recordsPerDay = interval === "1m"
        ? 24 * 60
        : interval === "1h"
            ? 24
            : 1;
    const estimatedRecords = Math.ceil(recordsPerDay * durationDays);
    const estimatedDataSizeMb = (estimatedRecords * 0.5) / 1024; // ~0.5 KB per record
    return {
        market_condition_id: params.market_condition_id,
        start_time: startTime,
        end_time: endTime,
        interval,
        duration_days: Math.ceil(durationDays),
        candlestick_data: {
            interval_seconds: intervalSeconds,
            max_range_seconds: INTERVAL_LIMITS[interval],
            range_violation: durationSeconds > INTERVAL_LIMITS[interval],
        },
        trade_data: {
            can_fetch: true,
            estimated_records: requiresTradeHistory ? estimatedRecords : 0,
        },
        estimated_api_calls: estimatedApiCalls,
        estimated_data_size_mb: parseFloat(estimatedDataSizeMb.toFixed(2)),
        requires_trade_history: requiresTradeHistory,
        requires_candlesticks: requiresCandlesticks,
    };
}
/**
 * Generate a comprehensive backtest plan
 */
export function generateBacktestPlan(params) {
    const dataRequirements = calculateDataRequirements(params);
    // Generate strategy-specific content
    const strategyContent = getStrategyContent(params.strategy_type);
    return {
        research_question: strategyContent.researchQuestion,
        hypothesis: strategyContent.hypothesis,
        market_condition_id: params.market_condition_id,
        time_range: {
            start: dataRequirements.start_time,
            end: dataRequirements.end_time,
        },
        strategy_type: params.strategy_type,
        data_requirements: dataRequirements,
        assumptions: strategyContent.assumptions,
        constraints: strategyContent.constraints,
        expected_outputs: strategyContent.expectedOutputs,
        risk_considerations: strategyContent.riskConsiderations,
        success_criteria: strategyContent.successCriteria,
    };
}
/**
 * Get strategy-specific content
 */
function getStrategyContent(strategyType) {
    const contents = {
        event_driven: {
            researchQuestion: "How do price movements around market events present trading opportunities?",
            hypothesis: "Markets exhibit predictable volatility patterns around event times",
            assumptions: [
                "Event timestamps are accurate",
                "Market reactions follow predictable patterns",
                "Liquidity is sufficient during event windows",
            ],
            constraints: [
                "Limited to markets with clear event timelines",
                "Requires high-frequency data for event windows",
                "Event cancellation risk",
            ],
            expectedOutputs: [
                "Event window price analysis",
                "Volatility profile",
                "Optimal entry/exit timing",
            ],
            riskConsiderations: [
                "Event cancellation or postponement",
                "Binary outcome risk",
                "Illiquidity during events",
            ],
            successCriteria: [
                "Positive Sharpe ratio",
                "Maximum drawdown < 20%",
                "Win rate > 55%",
            ],
        },
        price_driven: {
            researchQuestion: "Can technical indicators predict profitable entry and exit points?",
            hypothesis: "Price patterns and technical indicators provide tradeable signals",
            assumptions: [
                "Historical price patterns repeat",
                "Technical indicators are predictive",
                "Markets are sufficiently liquid",
            ],
            constraints: [
                "Indicator lag may miss optimal entries",
                "False signals in ranging markets",
                "Requires adequate price history",
            ],
            expectedOutputs: [
                "Signal distribution analysis",
                "Indicator effectiveness metrics",
                "Optimal parameter sets",
            ],
            riskConsiderations: [
                "Whipsaw losses in choppy markets",
                "Indicator failure during regime changes",
                "Overfitting to historical data",
            ],
            successCriteria: [
                "Profit factor > 1.5",
                "Consistent performance across markets",
                "Robust to parameter changes",
            ],
        },
        momentum: {
            researchQuestion: "Does price momentum persist long enough to capture profits?",
            hypothesis: "Prices exhibit short-term momentum that can be captured through trend-following",
            assumptions: [
                "Momentum signals can be captured before decay",
                "Trends persist beyond transaction costs",
                "Markets trend more than revert",
            ],
            constraints: [
                "Momentum crashes during reversals",
                "Late entry reduces profit potential",
                "Requires trending markets",
            ],
            expectedOutputs: [
                "Trend capture rate",
                "Momentum decay analysis",
                "Optimal holding periods",
            ],
            riskConsiderations: [
                "Momentum crashes during reversals",
                "Late entry risk",
                "Churn in ranging markets",
            ],
            successCriteria: [
                "Positive returns in trending periods",
                "Quick exit when momentum fades",
                "Outperformance vs buy-and-hold",
            ],
        },
        mean_reversion: {
            researchQuestion: "Do price extremes reliably revert to mean?",
            hypothesis: "Price deviations from averages tend to revert to historical means",
            assumptions: [
                "Price extremes are identifiable",
                "Reversion occurs in tradeable timeframes",
                "Markets are bounded in range",
            ],
            constraints: [
                "Unlimited downside if trend continues",
                "Timing reversion is difficult",
                "Requires defined boundaries",
            ],
            expectedOutputs: [
                "Reversion time analysis",
                "Threshold effectiveness",
                "Mean calculation methodology",
            ],
            riskConsiderations: [
                "Unlimited downside if trend continues",
                "Structural break risk",
                "Early exit before full reversion",
            ],
            successCriteria: [
                "High win rate on reversion trades",
                "Limited losses on failed reversions",
                "Consistent performance across markets",
            ],
        },
    };
    return contents[strategyType];
}
/**
 * Check data coverage for a time range
 */
export function checkDataCoverage(conditionId, startTime, endTime, dataType, interval) {
    const recommendations = [];
    // Check if interval is appropriate for time range
    if (dataType === "candlesticks" && interval) {
        const rangeSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
        const maxRange = INTERVAL_LIMITS[interval];
        if (rangeSeconds > maxRange) {
            recommendations.push(`Time range exceeds ${interval} limit. Use a larger interval (1h or 1d) or split into chunks.`);
            return {
                has_coverage: false,
                coverage_percentage: maxRange / rangeSeconds,
                gaps: [{ start: new Date(startTime.getTime() + maxRange * 1000), end: endTime }],
                recommendations,
            };
        }
    }
    // For this implementation, we assume coverage is possible
    // In a real implementation, this would check against actual data availability
    return {
        has_coverage: true,
        coverage_percentage: 100,
        gaps: [],
        recommendations: ["Data coverage appears sufficient for the requested range"],
    };
}
/**
 * Estimate API costs for data fetching
 */
export function estimateApiCosts(dataRequirements) {
    const { estimated_api_calls, requires_trade_history, requires_candlesticks } = dataRequirements;
    // Simplified cost estimation (adjust based on actual API pricing)
    const costPerCall = 0.01; // $0.01 per API call (example)
    const estimatedCost = estimated_api_calls * costPerCall;
    const costBreakdown = {};
    if (requires_candlesticks) {
        costBreakdown.candlesticks = estimated_api_calls * costPerCall * 0.7;
    }
    if (requires_trade_history) {
        costBreakdown.trades = estimated_api_calls * costPerCall * 0.3;
    }
    const optimizationSuggestions = [];
    if (estimated_api_calls > 10) {
        optimizationSuggestions.push("Consider using a larger interval to reduce API calls");
    }
    if (dataRequirements.duration_days > 90) {
        optimizationSuggestions.push("For long time ranges, consider using 1d interval instead of 1h or 1m");
    }
    return {
        estimated_calls: estimated_api_calls,
        estimated_cost_usd: parseFloat(estimatedCost.toFixed(2)),
        cost_breakdown: costBreakdown,
        optimization_suggestions: optimizationSuggestions,
    };
}
//# sourceMappingURL=backtestPlanner.js.map