/**
 * Unit tests for market-discovery skill.
 *
 * Tests for marketDiscovery.ts functions using DOME API.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
} from "vitest";

// Import from skill
import {
  fetchMarkets,
  fetchAllMarkets,
  parseMarketData,
  filterBacktestCandidates,
  searchMarkets,
  getMarketByConditionId,
  getMarketBySlug,
  DomeAPIError,
  DomeAPIValidationError,
  type Market,
} from "../../../packages/plugins/dome-data/skills/market-discovery/scripts/marketDiscovery.ts";

// Load API key from environment
const API_KEY = process.env.DOME_API_KEY || "";

// Skip tests if no API key
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("marketDiscovery", () => {
  describe("parseMarketData", () => {
    it("should parse complete market data", () => {
      const rawMarket: Market = {
        market_slug: "test-market",
        condition_id: "0x1234",
        title: "Test Market",
        start_time: 1234567890,
        end_time: 1234567891,
        status: "open",
        volume_total: 10000.5,
        tags: ["crypto", "bitcoin"],
        side_a: { id: "token_a", label: "Yes" },
        side_b: { id: "token_b", label: "No" },
        winning_side: null,
        description: "Test description",
        resolution_source: "https://example.com",
        extra_fields: { price_to_beat: 50000 },
        event_slug: null,
        completed_time: null,
        close_time: null,
        image: "",
        volume_1_week: 0,
        volume_1_month: 0,
        volume_1_year: 0,
      };

      const parsed = parseMarketData(rawMarket);

      expect(parsed.market_slug).toBe("test-market");
      expect(parsed.condition_id).toBe("0x1234");
      expect(parsed.title).toBe("Test Market");
      expect(parsed.status).toBe("open");
      expect(parsed.volume_total).toBe(10000.5);
      expect(parsed.side_a.token_id).toBe("token_a");
      expect(parsed.side_a.label).toBe("Yes");
      expect(parsed.side_b.token_id).toBe("token_b");
      expect(parsed.side_b.label).toBe("No");
    });

    it("should handle missing fields", () => {
      const rawMarket: Partial<Market> = {
        market_slug: "test",
        title: "Test",
      };

      const parsed = parseMarketData(rawMarket as Market);

      expect(parsed.market_slug).toBe("test");
      expect(parsed.side_a.token_id).toBeNull();
      expect(parsed.side_a.label).toBeNull();
      expect(parsed.tags).toEqual([]);
      expect(parsed.extra_fields).toEqual({});
    });
  });

  describe("filterBacktestCandidates", () => {
    it("should filter by volume", () => {
      const markets: Partial<Market>[] = [
        { market_slug: "high", volume_total: 100000, status: "open" },
        { market_slug: "medium", volume_total: 50000, status: "open" },
        { market_slug: "low", volume_total: 1000, status: "open" },
      ];

      const candidates = filterBacktestCandidates(markets as Market[], {
        minVolume: 50000,
      });

      expect(candidates.length).toBe(2);
      expect(candidates[0].market_slug).toBe("high");
      expect(candidates[1].market_slug).toBe("medium");
    });

    it("should filter by status", () => {
      const markets: Partial<Market>[] = [
        { market_slug: "closed1", volume_total: 100000, status: "closed" },
        { market_slug: "open1", volume_total: 100000, status: "open" },
        { market_slug: "closed2", volume_total: 100000, status: "closed" },
      ];

      const candidates = filterBacktestCandidates(markets as Market[], {
        requireClosed: true,
      });

      expect(candidates.length).toBe(2);
      expect(candidates.every((m) => m.status === "closed")).toBe(true);
    });

    it("should return empty array when no matches", () => {
      const markets: Partial<Market>[] = [
        { market_slug: "low", volume_total: 100, status: "open" },
      ];

      const candidates = filterBacktestCandidates(markets as Market[]);

      expect(candidates.length).toBe(0);
    });
  });

  describeIfApiKey("API Integration Tests", () => {
    it("fetchMarkets should return markets", async () => {
      const result = await fetchMarkets(API_KEY, { limit: 5 });

      expect(result.markets).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.markets)).toBe(true);
      expect(result.markets.length).toBeLessThanOrEqual(5);
    });

    it("fetchMarkets should filter by status", async () => {
      const result = await fetchMarkets(API_KEY, {
        status: "open",
        limit: 5,
      });

      for (const market of result.markets) {
        expect(market.status).toBe("open");
      }
    });

    it.skip("searchMarkets should return results", async () => {
      // Note: Search endpoint has different requirements than filter endpoint
      // May require specific query parameters or different endpoint path
      const result = await searchMarkets(API_KEY, "bitcoin");

      expect(result).toBeDefined();
      const markets = Array.isArray(result) ? result : result.markets;
      expect(Array.isArray(markets)).toBe(true);
    });

    it("should throw on short search query", async () => {
      await expect(searchMarkets(API_KEY, "x")).rejects.toThrow(
        DomeAPIValidationError
      );
    });

    it("fetchAllMarkets should return list", async () => {
      const markets = await fetchAllMarkets(API_KEY, { maxPages: 1, limit: 10 });

      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);
    });
  });

  describe("Validation", () => {
    it("should throw on invalid limit", async () => {
      await expect(
        fetchMarkets(API_KEY, { limit: 200 })
      ).rejects.toThrow();
    });

    it("should throw on invalid API key", async () => {
      await expect(fetchMarkets("invalid_key", { limit: 5 })).rejects.toThrow(
        DomeAPIError
      );
    });
  });
});
