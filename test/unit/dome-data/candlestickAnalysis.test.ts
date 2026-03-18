/**
 * Unit tests for candlestick-analysis skill.
 *
 * Tests for candlestickAnalysis.ts functions.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  validateTimeRange,
  parseCandlestickData,
  calculateSMA,
  calculateEMA,
  calculateVolatility,
  detectPriceTrends,
  formatCandlestickSummary,
  getIntervalName,
  INTERVAL_LIMITS,
  ValidationError,
  type Candlestick,
  type CandlestickSeries,
  type TokenMetadata,
} from "../../../packages/plugins/dome-data/skills/candlestick-analysis/scripts/candlestickAnalysis.ts";

describe("candlestickAnalysis", () => {
  describe("validateTimeRange", () => {
    it("should validate valid 1m range", () => {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 6 * 24 * 60 * 60; // 6 days

      expect(() =>
        validateTimeRange(startTime, endTime, 1)
      ).not.toThrow();
    });

    it("should throw on 1m exceeding 1 week", () => {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 10 * 24 * 60 * 60; // 10 days

      expect(() => validateTimeRange(startTime, endTime, 1)).toThrow(
        ValidationError
      );
    });

    it("should throw on invalid interval", () => {
      expect(() => validateTimeRange(1000, 2000, 30)).toThrow(
        ValidationError
      );
    });

    it("should throw when start >= end", () => {
      expect(() => validateTimeRange(2000, 1000, 1)).toThrow(
        ValidationError
      );
    });
  });

  describe("parseCandlestickData", () => {
    it("should parse valid response", () => {
      const response = {
        candlesticks: [
          [
            [
              {
                end_period_ts: 1727827200,
                price: { open: 0.5, high: 0.6, low: 0.4, close: 0.55 },
                volume: 1000,
                open_interest: 500,
                yes_ask: { open: 0.51, close: 0.56, high: 0.61, low: 0.41 },
                yes_bid: { open: 0.49, close: 0.54, high: 0.59, low: 0.39 },
              },
            ],
            { token_id: "token123", side: "Yes" },
          ],
        ],
      };

      const result = parseCandlestickData(response);

      expect(result.length).toBe(1);
      expect(result[0].token_metadata.side).toBe("Yes");
      expect(result[0].candlesticks[0].close_price).toBe(0.55);
    });

    it("should return empty for empty response", () => {
      const result = parseCandlestickData({ candlesticks: [] });
      expect(result).toEqual([]);
    });
  });

  describe("calculateSMA", () => {
    it("should calculate SMA correctly", () => {
      const prices = [1, 2, 3, 4, 5];
      const result = calculateSMA(prices, 3);

      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBe(2);
      expect(result[3]).toBe(3);
      expect(result[4]).toBe(4);
    });

    it("should throw on invalid period", () => {
      expect(() => calculateSMA([1, 2, 3], 0)).toThrow();
    });
  });

  describe("calculateEMA", () => {
    it("should calculate EMA correctly", () => {
      const prices = [10, 11, 12, 13, 14];
      const result = calculateEMA(prices, 3);

      expect(result[2]).toBe(11);
      expect(result[3]).toBe(12);
      expect(result[4]).toBe(13);
    });

    it("should throw on invalid period", () => {
      expect(() => calculateEMA([1, 2, 3], 0)).toThrow();
    });
  });

  describe("calculateVolatility", () => {
    it("should return zero for constant prices", () => {
      const prices = [10, 10, 10, 10, 10];
      const result = calculateVolatility(prices, 3);

      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
    });

    it("should calculate volatility for varying prices", () => {
      const prices = [10, 12, 8, 14, 6];
      const result = calculateVolatility(prices, 3);

      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]! > 0).toBe(true);
    });
  });

  describe("detectPriceTrends", () => {
    it("should detect upward trend", () => {
      const candles: Candlestick[] = [
        createCandlestick(0.5),
        createCandlestick(0.52),
        createCandlestick(0.54),
        createCandlestick(0.56),
        createCandlestick(0.58),
      ];

      const result = detectPriceTrends(candles);

      expect(result.trend).toBe("up");
      expect(result.trend_strength > 0).toBe(true);
    });

    it("should detect downward trend", () => {
      const candles: Candlestick[] = [
        createCandlestick(0.58),
        createCandlestick(0.56),
        createCandlestick(0.54),
        createCandlestick(0.52),
        createCandlestick(0.5),
      ];

      const result = detectPriceTrends(candles);

      expect(result.trend).toBe("down");
    });

    it("should return unknown for empty array", () => {
      const result = detectPriceTrends([]);
      expect(result.trend).toBe("unknown");
    });
  });

  describe("formatCandlestickSummary", () => {
    it("should format summary correctly", () => {
      const series: CandlestickSeries = {
        token_metadata: { token_id: "token1", side: "Yes" },
        candlesticks: [
          createCandlestick(0.5),
          createCandlestick(0.6),
        ],
      };

      const result = formatCandlestickSummary(series);

      expect(result.side).toBe("Yes");
      expect(result.data_points).toBe(2);
      // Change from first open (0.49) to last close (0.6): (0.6 - 0.49) / 0.49 * 100 = 22.45%
      expect(result.price_summary.change_pct).toBeCloseTo(22.45, 1);
    });
  });

  describe("getIntervalName", () => {
    it("should return correct names", () => {
      expect(getIntervalName(1)).toBe("1 minute");
      expect(getIntervalName(60)).toBe("1 hour");
      expect(getIntervalName(1440)).toBe("1 day");
    });
  });
});

// Helper function
function createCandlestick(close: number, open?: number): Candlestick {
  const o = open ?? close - 0.01;
  return {
    end_period_ts: 1000,
    open_price: o,
    high_price: Math.max(o, close) + 0.01,
    low_price: Math.min(o, close) - 0.01,
    close_price: close,
    volume: 100,
    open_interest: 50,
    yes_ask_open: 0,
    yes_ask_close: 0,
    yes_ask_high: 0,
    yes_ask_low: 0,
    yes_bid_open: 0,
    yes_bid_close: 0,
    yes_bid_high: 0,
    yes_bid_low: 0,
  };
}
