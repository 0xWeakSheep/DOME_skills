/**
 * Unit tests for historical-trades skill.
 *
 * Tests for historicalTrades.ts functions.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  fetchTrades,
  fetchAllTrades,
  parseTradeData,
  calculateTradeStats,
  aggregateTradesByTime,
  ValidationError,
  type Trade,
  type FetchTradesParams,
} from "../../../packages/plugins/dome-data/skills/historical-trades/scripts/historicalTrades.ts";

const API_KEY = process.env.DOME_API_KEY || "";
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("historicalTrades", () => {
  describe("parseTradeData", () => {
    it("should parse complete trade", () => {
      const rawTrade: Trade = {
        token_id: "12345",
        token_label: "Yes",
        side: "BUY",
        market_slug: "test-market",
        condition_id: "0xabc",
        shares: 4995000,
        shares_normalized: 4.995,
        price: 0.65,
        timestamp: 1757008834,
        user: "0xuser",
        tx_hash: "0xtx",
        block_number: 123456,
        title: "Test Market",
        order_hash: "0xorder",
        taker: "0xtaker",
        log_index: 0,
      };

      const parsed = parseTradeData(rawTrade);

      expect(parsed.token_id).toBe("12345");
      expect(parsed.side).toBe("BUY");
      expect(parsed.shares_normalized).toBe(4.995);
      expect(parsed.price).toBe(0.65);
    });

    it("should handle partial trade", () => {
      const rawTrade: Partial<Trade> = {
        token_id: "12345",
        side: "SELL",
        price: 0.5,
      };

      const parsed = parseTradeData(rawTrade);

      expect(parsed.token_id).toBe("12345");
      expect(parsed.token_label).toBeNull();
      expect(parsed.market_slug).toBeNull();
    });
  });

  describe("calculateTradeStats", () => {
    it("should return zero stats for empty array", () => {
      const stats = calculateTradeStats([]);

      expect(stats.total_trades).toBe(0);
      expect(stats.total_volume).toBe(0);
      expect(stats.buy_count).toBe(0);
      expect(stats.sell_count).toBe(0);
    });

    it("should calculate stats for single buy", () => {
      const trades: Partial<Trade>[] = [
        { side: "BUY", shares_normalized: 10, price: 0.5 },
      ];

      const stats = calculateTradeStats(trades);

      expect(stats.total_trades).toBe(1);
      expect(stats.total_volume).toBe(5);
      expect(stats.buy_count).toBe(1);
      expect(stats.sell_count).toBe(0);
      expect(stats.buy_volume).toBe(5);
    });

    it("should calculate stats for mixed trades", () => {
      const trades: Partial<Trade>[] = [
        { side: "BUY", shares_normalized: 10, price: 0.5 },
        { side: "BUY", shares_normalized: 5, price: 0.6 },
        { side: "SELL", shares_normalized: 3, price: 0.7 },
        { side: "SELL", shares_normalized: 2, price: 0.8 },
      ];

      const stats = calculateTradeStats(trades);

      expect(stats.total_trades).toBe(4);
      expect(stats.buy_count).toBe(2);
      expect(stats.sell_count).toBe(2);
      expect(stats.buy_sell_ratio).toBe(1);
    });
  });

  describe("aggregateTradesByTime", () => {
    it("should return empty for empty array", () => {
      const result = aggregateTradesByTime([], 3600);
      expect(Object.keys(result).length).toBe(0);
    });

    it("should aggregate into single bucket", () => {
      const baseTime = 1704153600;
      const trades: Partial<Trade>[] = [
        { timestamp: baseTime, side: "BUY", shares_normalized: 10, price: 0.5 },
        {
          timestamp: baseTime + 1800,
          side: "SELL",
          shares_normalized: 5,
          price: 0.6,
        },
      ];

      const result = aggregateTradesByTime(trades, 3600);

      expect(Object.keys(result).length).toBe(1);
      const bucket = result[baseTime];
      expect(bucket.count).toBe(2);
      expect(bucket.buy_count).toBe(1);
      expect(bucket.sell_count).toBe(1);
    });

    it("should split into multiple buckets", () => {
      const baseTime = 1704153600;
      const trades: Partial<Trade>[] = [
        { timestamp: baseTime, side: "BUY", shares_normalized: 10, price: 0.5 },
        {
          timestamp: baseTime + 3600,
          side: "SELL",
          shares_normalized: 5,
          price: 0.6,
        },
        {
          timestamp: baseTime + 7200,
          side: "BUY",
          shares_normalized: 8,
          price: 0.7,
        },
      ];

      const result = aggregateTradesByTime(trades, 3600);

      expect(Object.keys(result).length).toBe(3);
    });
  });

  describe("Validation", () => {
    it("should throw on mutually exclusive filters", () => {
      const params: FetchTradesParams = {
        market_slug: "test",
        token_id: "123",
      };

      expect(() => fetchTrades(API_KEY, params)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw on invalid limit", () => {
      const params: FetchTradesParams = {
        market_slug: "test",
        limit: 5000,
      };

      expect(() => fetchTrades(API_KEY, params)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
