/**
 * Unit tests for orderbook-analysis skill.
 *
 * Tests for orderbookAnalysis.ts functions using DOME API.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  parseOrderbookSnapshot,
  calculateSpread,
  analyzeLiquidity,
  detectPriceImpact,
  getLiquidityProfile,
  calculateWeightedAveragePrice,
  type OrderbookSnapshot,
  type BidAsk,
} from "../../../packages/plugins/dome-market-depth/skills/orderbook-analysis/scripts/orderbookAnalysis.ts";

const API_KEY = process.env.DOME_API_KEY || "";
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("orderbookAnalysis", () => {
  describe("parseOrderbookSnapshot", () => {
    it("should parse complete snapshot", () => {
      const rawSnapshot: OrderbookSnapshot = {
        asks: [
          { size: "5000013.15", price: "0.999" },
          { size: "3000000.00", price: "0.998" },
        ],
        bids: [
          { size: "438389.53", price: "0.001" },
          { size: "500000.00", price: "0.002" },
        ],
        hash: "85c493ebeea97e2f70c85a1469aede05f892408f",
        minOrderSize: "5",
        negRisk: true,
        assetId:
          "56369772478534954338683665819559528414197495274302917800610633957542171787417",
        timestamp: 1760471849407,
        tickSize: "0.001",
        indexedAt: 1760471852863,
        market: "0xd10bc768ede58b53ed400594240b0a0603134a32dab89ec823a18759cbc180ca",
      };

      const parsed = parseOrderbookSnapshot(rawSnapshot);

      expect(parsed.asks.length).toBe(2);
      expect(parsed.bids.length).toBe(2);
      expect(parsed.asks[0].price).toBe(0.998); // Sorted ascending
      expect(parsed.bids[0].price).toBe(0.002); // Sorted descending
      expect(parsed.timestamp).toBe(1760471849407);
    });

    it("should handle empty orderbook", () => {
      const rawSnapshot: Partial<OrderbookSnapshot> = {
        asks: [],
        bids: [],
        timestamp: 1760471849407,
      };

      const parsed = parseOrderbookSnapshot(rawSnapshot as OrderbookSnapshot);

      expect(parsed.asks).toEqual([]);
      expect(parsed.bids).toEqual([]);
      expect(parsed.midPrice).toBeNull();
    });

    it("should calculate mid price correctly", () => {
      const rawSnapshot: OrderbookSnapshot = {
        asks: [{ size: "1000", price: "0.6" }],
        bids: [{ size: "1000", price: "0.5" }],
        hash: "test",
        minOrderSize: "5",
        negRisk: false,
        assetId: "123",
        timestamp: 1760471849407,
        tickSize: "0.001",
        indexedAt: 1760471852863,
        market: "0xabc",
      };

      const parsed = parseOrderbookSnapshot(rawSnapshot);

      expect(parsed.midPrice).toBe(0.55);
    });
  });

  describe("calculateSpread", () => {
    it("should calculate spread correctly", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 1000 },
        { price: 0.61, size: 2000 },
      ];
      const bids: BidAsk[] = [
        { price: 0.5, size: 1000 },
        { price: 0.49, size: 2000 },
      ];

      const spread = calculateSpread(asks, bids);

      expect(spread.best_ask).toBe(0.6);
      expect(spread.best_bid).toBe(0.5);
      expect(spread.spread_absolute).toBeCloseTo(0.1, 10);
      expect(spread.spread_percentage).toBeCloseTo(18.18, 1);
    });

    it("should handle empty orderbook", () => {
      const spread = calculateSpread([], []);

      expect(spread.best_ask).toBeNull();
      expect(spread.best_bid).toBeNull();
      expect(spread.spread_absolute).toBeNull();
    });

    it("should handle missing asks", () => {
      const bids: BidAsk[] = [{ price: 0.5, size: 1000 }];

      const spread = calculateSpread([], bids);

      expect(spread.best_ask).toBeNull();
      expect(spread.best_bid).toBe(0.5);
      expect(spread.spread_absolute).toBeNull();
    });
  });

  describe("analyzeLiquidity", () => {
    it("should calculate liquidity metrics", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 10000 },
        { price: 0.61, size: 20000 },
        { price: 0.62, size: 30000 },
      ];
      const bids: BidAsk[] = [
        { price: 0.5, size: 15000 },
        { price: 0.49, size: 25000 },
        { price: 0.48, size: 35000 },
      ];

      const liquidity = analyzeLiquidity(asks, bids);

      expect(liquidity.total_ask_liquidity).toBe(60000);
      expect(liquidity.total_bid_liquidity).toBe(75000);
      expect(liquidity.depth_2_percent.ask_depth).toBeGreaterThan(0);
      expect(liquidity.depth_2_percent.bid_depth).toBeGreaterThan(0);
    });

    it("should handle empty orderbook", () => {
      const liquidity = analyzeLiquidity([], []);

      expect(liquidity.total_ask_liquidity).toBe(0);
      expect(liquidity.total_bid_liquidity).toBe(0);
      expect(liquidity.depth_2_percent.ask_depth).toBe(0);
    });

    it("should calculate depth within percentage range", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 10000 },
        { price: 0.612, size: 20000 }, // 2% above best ask
        { price: 0.63, size: 30000 }, // 5% above best ask
      ];
      const bids: BidAsk[] = [
        { price: 0.5, size: 15000 },
        { price: 0.49, size: 25000 }, // 2% below best bid
      ];

      const liquidity = analyzeLiquidity(asks, bids);

      // Should only include orders within 2% of best price
      expect(liquidity.depth_2_percent.ask_depth).toBe(30000);
      expect(liquidity.depth_2_percent.bid_depth).toBe(40000);
    });
  });

  describe("detectPriceImpact", () => {
    it("should calculate price impact for buy order", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 1000 },
        { price: 0.61, size: 2000 },
        { price: 0.62, size: 3000 },
      ];

      const impact = detectPriceImpact(asks, "buy", 2500);

      expect(impact.executable).toBe(true);
      expect(impact.average_price).toBeGreaterThan(0.6);
      expect(impact.price_impact_percent).toBeGreaterThan(0);
    });

    it("should calculate price impact for sell order", () => {
      const bids: BidAsk[] = [
        { price: 0.5, size: 1000 },
        { price: 0.49, size: 2000 },
        { price: 0.48, size: 3000 },
      ];

      const impact = detectPriceImpact(bids, "sell", 2500);

      expect(impact.executable).toBe(true);
      expect(impact.average_price).toBeLessThan(0.5);
      expect(impact.price_impact_percent).toBeGreaterThan(0);
    });

    it("should detect insufficient liquidity", () => {
      const asks: BidAsk[] = [{ price: 0.6, size: 100 }];

      const impact = detectPriceImpact(asks, "buy", 10000);

      expect(impact.executable).toBe(false);
      expect(impact.missing_liquidity).toBe(9900);
    });

    it("should handle zero size order", () => {
      const asks: BidAsk[] = [{ price: 0.6, size: 1000 }];

      const impact = detectPriceImpact(asks, "buy", 0);

      expect(impact.executable).toBe(true);
      expect(impact.average_price).toBe(0.6);
      expect(impact.price_impact_percent).toBe(0);
    });
  });

  describe("calculateWeightedAveragePrice", () => {
    it("should calculate VWAP correctly", () => {
      const orders: BidAsk[] = [
        { price: 0.6, size: 1000 },
        { price: 0.61, size: 2000 },
      ];

      const vwap = calculateWeightedAveragePrice(orders);

      // (0.6 * 1000 + 0.61 * 2000) / 3000 = 0.6067
      expect(vwap).toBeCloseTo(0.6067, 3);
    });

    it("should return 0 for empty orders", () => {
      const vwap = calculateWeightedAveragePrice([]);
      expect(vwap).toBe(0);
    });
  });

  describe("getLiquidityProfile", () => {
    it("should generate liquidity profile", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 10000 },
        { price: 0.61, size: 20000 },
        { price: 0.62, size: 30000 },
        { price: 0.63, size: 40000 },
      ];
      const bids: BidAsk[] = [
        { price: 0.5, size: 15000 },
        { price: 0.49, size: 25000 },
        { price: 0.48, size: 35000 },
      ];

      const profile = getLiquidityProfile(asks, bids);

      expect(profile.best_ask).toBe(0.6);
      expect(profile.best_bid).toBe(0.5);
      expect(profile.ask_levels.length).toBeGreaterThan(0);
      expect(profile.bid_levels.length).toBeGreaterThan(0);
      expect(profile.total_ask_size).toBe(100000);
      expect(profile.total_bid_size).toBe(75000);
    });

    it("should identify optimal trade size", () => {
      const asks: BidAsk[] = [
        { price: 0.6, size: 10000 },
        { price: 0.65, size: 10000 },
      ];
      const bids: BidAsk[] = [
        { price: 0.5, size: 15000 },
        { price: 0.45, size: 15000 },
      ];

      const profile = getLiquidityProfile(asks, bids);

      expect(profile.optimal_trade_size).toBeGreaterThan(0);
      expect(profile.recommended_max_trade).toBeGreaterThan(0);
    });
  });
});