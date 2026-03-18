/**
 * Unit tests for backtest-planner skill.
 *
 * Tests for backtestPlanner.ts functions.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  validateBacktestParams,
  calculateDataRequirements,
  generateBacktestPlan,
  checkDataCoverage,
  estimateApiCosts,
  ValidationError,
  DataCoverageError,
  VALID_STRATEGY_TYPES,
  INTERVAL_LIMITS,
  type BacktestParams,
  type StrategyType,
} from "../../../packages/plugins/dome-backtesting/skills/backtest-planner/scripts/backtestPlanner.ts";

describe("backtestPlanner", () => {
  describe("validateBacktestParams", () => {
    it("should validate correct params", () => {
      const params: BacktestParams = {
        market_condition_id: "0x1234",
        start_time: "2024-01-01",
        end_time: "2024-01-15",  // 14 days, within 30 day limit for 1h
        strategy_type: "momentum",
        interval: "1h",
      };

      const result = validateBacktestParams(params);

      expect(result.is_valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should fail on missing required fields", () => {
      const result = validateBacktestParams({
        market_condition_id: "0x1234",
      });

      expect(result.is_valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should fail on invalid strategy type", () => {
      const result = validateBacktestParams({
        market_condition_id: "0x1234",
        start_time: "2024-01-01",
        end_time: "2024-02-01",
        strategy_type: "invalid_strategy" as StrategyType,
      });

      expect(result.is_valid).toBe(false);
      expect(result.errors.some((e) => e.includes("strategy_type"))).toBe(true);
    });

    it("should validate all valid strategy types", () => {
      for (const strategyType of VALID_STRATEGY_TYPES) {
        const result = validateBacktestParams({
          market_condition_id: "0x1234",
          start_time: "2024-01-01",
          end_time: "2024-01-07",  // 6 days, within 7 day limit for 1m
          strategy_type: strategyType,
          interval: "1m",
        });

        expect(result.is_valid).toBe(true);
      }
    });

    it("should fail when start >= end", () => {
      const result = validateBacktestParams({
        market_condition_id: "0x1234",
        start_time: "2024-03-01",
        end_time: "2024-01-01",
        strategy_type: "momentum",
      });

      expect(result.is_valid).toBe(false);
      expect(result.errors.some((e) => e.includes("start_time"))).toBe(true);
    });

    it("should fail on 1m interval exceeding 1 week", () => {
      const result = validateBacktestParams({
        market_condition_id: "0x1234",
        start_time: "2024-01-01",
        end_time: "2024-02-01", // More than 1 week
        strategy_type: "momentum",
        interval: "1m",
      });

      expect(result.is_valid).toBe(false);
      expect(result.errors.some((e) => e.includes("exceeds"))).toBe(true);
    });
  });

  describe("calculateDataRequirements", () => {
    it("should calculate requirements correctly", () => {
      const params: BacktestParams = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-01-15"),
        strategy_type: "momentum",
        interval: "1h",
      };

      const result = calculateDataRequirements(params);

      expect(result.market_condition_id).toBe("0x1234");
      expect(result.interval).toBe("1h");
      // Jan 1 to Jan 15 is 14 days (not 15)
      expect(result.duration_days).toBe(14);
      expect(result.requires_candlesticks).toBe(true);
      expect(result.requires_trade_history).toBe(false);
      expect(result.estimated_api_calls).toBeGreaterThanOrEqual(1);
      expect(result.estimated_data_size_mb).toBeGreaterThan(0);
    });

    it("should require trade history for event_driven", () => {
      const params: BacktestParams = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-01-07"),
        strategy_type: "event_driven",
        interval: "1m",
      };

      const result = calculateDataRequirements(params);

      expect(result.requires_trade_history).toBe(true);
    });

    it("should detect range violation", () => {
      const params: BacktestParams = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-02-01"),
        strategy_type: "momentum",
        interval: "1m",
      };

      const result = calculateDataRequirements(params);

      expect(result.candlestick_data.range_violation).toBe(true);
    });
  });

  describe("generateBacktestPlan", () => {
    it("should generate complete plan", () => {
      const params: BacktestParams = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-02-01"),
        strategy_type: "momentum",
        interval: "1h",
      };

      const plan = generateBacktestPlan(params);

      expect(plan.research_question).toBeDefined();
      expect(plan.hypothesis).toBeDefined();
      expect(plan.market_condition_id).toBe("0x1234");
      expect(plan.strategy_type).toBe("momentum");
      expect(plan.assumptions.length).toBeGreaterThan(0);
      expect(plan.constraints.length).toBeGreaterThan(0);
      expect(plan.risk_considerations.length).toBeGreaterThan(0);
      expect(plan.success_criteria.length).toBeGreaterThan(0);
    });

    it("should generate different content for different strategies", () => {
      const strategies: StrategyType[] = [
        "momentum",
        "mean_reversion",
        "event_driven",
        "price_driven",
      ];

      const plans = strategies.map((strategy_type) =>
        generateBacktestPlan({
          market_condition_id: "0x1234",
          start_time: new Date("2024-01-01"),
          end_time: new Date("2024-02-01"),
          strategy_type,
          interval: "1h",
        })
      );

      // Each plan should have different content
      expect(plans[0].research_question).not.toBe(plans[1].research_question);
    });
  });

  describe("checkDataCoverage", () => {
    it("should return has_coverage for valid range", () => {
      const result = checkDataCoverage(
        "0x1234",
        new Date("2024-01-01"),
        new Date("2024-01-15"),
        "candlesticks",
        "1h"
      );

      expect(result.has_coverage).toBe(true);
    });

    it("should detect range violation", () => {
      const result = checkDataCoverage(
        "0x1234",
        new Date("2024-01-01"),
        new Date("2024-03-01"),
        "candlesticks",
        "1m"
      );

      expect(result.has_coverage).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("estimateApiCosts", () => {
    it("should estimate costs correctly", () => {
      const dataRequirements = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-01-15"),
        interval: "1h" as const,
        duration_days: 15,
        candlestick_data: {
          interval_seconds: 3600,
          max_range_seconds: INTERVAL_LIMITS["1h"],
          range_violation: false,
        },
        trade_data: {
          can_fetch: true,
          estimated_records: 1000,
        },
        estimated_api_calls: 1,
        estimated_data_size_mb: 1.5,
        requires_trade_history: false,
        requires_candlesticks: true,
      };

      const result = estimateApiCosts(dataRequirements);

      expect(result.estimated_calls).toBe(1);
      expect(result.estimated_cost_usd).toBeGreaterThanOrEqual(0);
    });

    it("should provide optimization suggestions for large requests", () => {
      const dataRequirements = {
        market_condition_id: "0x1234",
        start_time: new Date("2024-01-01"),
        end_time: new Date("2024-12-31"),
        interval: "1h" as const,
        duration_days: 365,
        candlestick_data: {
          interval_seconds: 3600,
          max_range_seconds: INTERVAL_LIMITS["1h"],
          range_violation: true,
        },
        trade_data: {
          can_fetch: true,
          estimated_records: 10000,
        },
        estimated_api_calls: 100,
        estimated_data_size_mb: 50,
        requires_trade_history: true,
        requires_candlesticks: true,
      };

      const result = estimateApiCosts(dataRequirements);

      expect(result.optimization_suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Constants", () => {
    it("should have correct interval limits", () => {
      expect(INTERVAL_LIMITS["1m"]).toBe(7 * 24 * 60 * 60);
      expect(INTERVAL_LIMITS["1h"]).toBe(30 * 24 * 60 * 60);
      expect(INTERVAL_LIMITS["1d"]).toBe(365 * 24 * 60 * 60);
    });

    it("should have all strategy types", () => {
      expect(VALID_STRATEGY_TYPES).toContain("event_driven");
      expect(VALID_STRATEGY_TYPES).toContain("price_driven");
      expect(VALID_STRATEGY_TYPES).toContain("momentum");
      expect(VALID_STRATEGY_TYPES).toContain("mean_reversion");
    });
  });
});
