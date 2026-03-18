/**
 * Backtest Planner for DOME Polymarket Backtesting Workflows.
 *
 * This module provides utilities for planning and validating backtest parameters,
 * calculating data requirements, and generating comprehensive backtest plans.
 */
/** Strategy types supported for backtesting */
export type StrategyType = "event_driven" | "price_driven" | "momentum" | "mean_reversion";
/** Data intervals with their limitations */
export type DataInterval = "1m" | "1h" | "1d";
/** Interval limits in seconds */
export declare const INTERVAL_LIMITS: Record<DataInterval, number>;
/** Valid strategy types */
export declare const VALID_STRATEGY_TYPES: StrategyType[];
/** Custom error for validation failures */
export declare class ValidationError extends Error {
    constructor(message: string);
}
/** Custom error for data coverage issues */
export declare class DataCoverageError extends Error {
    constructor(message: string);
}
/** Backtest parameters */
export interface BacktestParams {
    market_condition_id: string;
    start_time: Date | string | number;
    end_time: Date | string | number;
    strategy_type: StrategyType;
    interval?: DataInterval;
    initial_capital?: number;
    position_size?: number;
}
/** Validation result */
export interface ValidationResult {
    is_valid: boolean;
    errors: string[];
}
/** Data requirements */
export interface DataRequirements {
    market_condition_id: string;
    start_time: Date;
    end_time: Date;
    interval: DataInterval;
    duration_days: number;
    candlestick_data: {
        interval_seconds: number;
        max_range_seconds: number;
        range_violation: boolean;
    };
    trade_data: {
        can_fetch: boolean;
        estimated_records: number;
    };
    estimated_api_calls: number;
    estimated_data_size_mb: number;
    requires_trade_history: boolean;
    requires_candlesticks: boolean;
}
/** Backtest plan */
export interface BacktestPlan {
    research_question: string;
    hypothesis: string;
    market_condition_id: string;
    time_range: {
        start: Date;
        end: Date;
    };
    strategy_type: StrategyType;
    data_requirements: DataRequirements;
    assumptions: string[];
    constraints: string[];
    expected_outputs: string[];
    risk_considerations: string[];
    success_criteria: string[];
}
/** Coverage check result */
export interface CoverageResult {
    has_coverage: boolean;
    coverage_percentage: number;
    gaps: Array<{
        start: Date;
        end: Date;
    }>;
    recommendations: string[];
}
/** Cost estimate */
export interface CostEstimate {
    estimated_calls: number;
    estimated_cost_usd: number;
    cost_breakdown: Record<string, number>;
    optimization_suggestions: string[];
}
/**
 * Validate backtest parameters
 */
export declare function validateBacktestParams(params: Partial<BacktestParams>): ValidationResult;
/**
 * Calculate data requirements for a backtest
 */
export declare function calculateDataRequirements(params: BacktestParams): DataRequirements;
/**
 * Generate a comprehensive backtest plan
 */
export declare function generateBacktestPlan(params: BacktestParams): BacktestPlan;
/**
 * Check data coverage for a time range
 */
export declare function checkDataCoverage(conditionId: string, startTime: Date, endTime: Date, dataType: "candlesticks" | "trades", interval?: DataInterval): CoverageResult;
/**
 * Estimate API costs for data fetching
 */
export declare function estimateApiCosts(dataRequirements: DataRequirements): CostEstimate;
//# sourceMappingURL=backtestPlanner.d.ts.map