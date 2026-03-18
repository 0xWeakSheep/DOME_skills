/**
 * Unit tests for wallet-analytics skill.
 *
 * Tests for walletAnalytics.ts functions using DOME API.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  parseWalletData,
  parsePositionData,
  parsePnLData,
  calculateTradingPerformance,
  getPositionSummary,
  calculateSharpeRatio,
  type Wallet,
  type Position,
  type PnLData,
  type PnLPeriod,
} from "../../../packages/plugins/dome-wallet/skills/wallet-analytics/scripts/walletAnalytics.ts";

const API_KEY = process.env.DOME_API_KEY || "";
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("walletAnalytics", () => {
  describe("parseWalletData", () => {
    it("should parse complete wallet data", () => {
      const rawWallet: Wallet = {
        eoa: "0xe9a69b28ffd86f6ea0c5d8171c95537479b84a29",
        proxy: "0x60881d7dce725bfb0399ee0b11cc11f5782f257d",
        wallet_type: "safe",
        handle: "satoshi",
        pseudonym: "Satoshi Nakamoto",
        image: "https://example.com/avatar.png",
        wallet_metrics: {
          total_volume: 150000.5,
          total_trades: 450,
          total_markets: 25,
          highest_volume_day: {
            date: "2025-10-12",
            volume: 25000.75,
            trades: 145,
          },
          merges: 262,
          splits: 31,
          conversions: 4,
          redemptions: 2338,
        },
      };

      const parsed = parseWalletData(rawWallet);

      expect(parsed.eoa).toBe("0xe9a69b28ffd86f6ea0c5d8171c95537479b84a29");
      expect(parsed.proxy).toBe("0x60881d7dce725bfb0399ee0b11cc11f5782f257d");
      expect(parsed.wallet_type).toBe("safe");
      expect(parsed.handle).toBe("satoshi");
      expect(parsed.total_volume).toBe(150000.5);
      expect(parsed.total_trades).toBe(450);
    });

    it("should handle missing metrics", () => {
      const rawWallet: Partial<Wallet> = {
        eoa: "0xe9a69b28ffd86f6ea0c5d8171c95537479b84a29",
        proxy: "0x60881d7dce725bfb0399ee0b11cc11f5782f257d",
        wallet_type: "eoa",
      };

      const parsed = parseWalletData(rawWallet as Wallet);

      expect(parsed.eoa).toBe("0xe9a69b28ffd86f6ea0c5d8171c95537479b84a29");
      expect(parsed.handle).toBeNull();
      expect(parsed.total_volume).toBe(0);
      expect(parsed.total_trades).toBe(0);
    });
  });

  describe("parsePositionData", () => {
    it("should parse complete position data", () => {
      const rawPosition: Position = {
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        token_id:
          "19701256321759583954581192053894521654935987478209343000964756587964612528044",
        condition_id: "0xabcd1234",
        title: "Will Bitcoin reach $100k by end of 2025?",
        shares: 50000000,
        shares_normalized: 50,
        redeemable: false,
        market_slug: "will-bitcoin-reach-100k-by-end-of-2025",
        event_slug: "bitcoin-price-predictions",
        image: "https://polymarket.com/images/...",
        label: "Yes",
        winning_outcome: null,
        start_time: 1640995200,
        end_time: 1672531200,
        completed_time: null,
        close_time: null,
        game_start_time: null,
        market_status: "open",
        negativeRisk: false,
      };

      const parsed = parsePositionData(rawPosition);

      expect(parsed.token_id).toBe(
        "19701256321759583954581192053894521654935987478209343000964756587964612528044"
      );
      expect(parsed.shares_normalized).toBe(50);
      expect(parsed.label).toBe("Yes");
      expect(parsed.market_status).toBe("open");
    });

    it("should handle partial position data", () => {
      const rawPosition: Partial<Position> = {
        token_id: "12345",
        shares_normalized: 10,
        label: "No",
      };

      const parsed = parsePositionData(rawPosition as Position);

      expect(parsed.token_id).toBe("12345");
      expect(parsed.title).toBeNull();
      expect(parsed.shares_normalized).toBe(10);
    });
  });

  describe("parsePnLData", () => {
    it("should parse PnL data correctly", () => {
      const rawPnL: PnLData = {
        granularity: "day",
        start_time: 1726857600,
        end_time: 1758316829,
        wallet_address: "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b",
        pnl_over_time: [
          { timestamp: 1726857600, pnl_to_date: 2001 },
          { timestamp: 1726944000, pnl_to_date: 2150 },
          { timestamp: 1727030400, pnl_to_date: 1980 },
        ],
      };

      const parsed = parsePnLData(rawPnL);

      expect(parsed.granularity).toBe("day");
      expect(parsed.wallet_address).toBe(
        "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b"
      );
      expect(parsed.pnl_over_time.length).toBe(3);
      expect(parsed.total_pnl).toBe(1980);
    });

    it("should handle empty PnL data", () => {
      const rawPnL: Partial<PnLData> = {
        granularity: "week",
        wallet_address: "0x123",
        pnl_over_time: [],
      };

      const parsed = parsePnLData(rawPnL as PnLData);

      expect(parsed.granularity).toBe("week");
      expect(parsed.total_pnl).toBe(0);
      expect(parsed.max_drawdown).toBe(0);
    });
  });

  describe("calculateTradingPerformance", () => {
    it("should calculate performance metrics", () => {
      const pnlPeriods: PnLPeriod[] = [
        { timestamp: 1, pnl_to_date: 100 },
        { timestamp: 2, pnl_to_date: 150 },
        { timestamp: 3, pnl_to_date: 120 },
        { timestamp: 4, pnl_to_date: 200 },
      ];

      const performance = calculateTradingPerformance(pnlPeriods);

      expect(performance.total_return).toBe(200);
      expect(performance.max_drawdown).toBeGreaterThan(0);
      expect(performance.profitable_days).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty periods", () => {
      const performance = calculateTradingPerformance([]);

      expect(performance.total_return).toBe(0);
      expect(performance.max_drawdown).toBe(0);
      expect(performance.sharpe_ratio).toBeNull();
    });

    it("should calculate win rate correctly", () => {
      const pnlPeriods: PnLPeriod[] = [
        { timestamp: 1, pnl_to_date: 100 },
        { timestamp: 2, pnl_to_date: 90 },
        { timestamp: 3, pnl_to_date: 120 },
        { timestamp: 4, pnl_to_date: 110 },
      ];

      const performance = calculateTradingPerformance(pnlPeriods);

      expect(performance.win_rate).toBeDefined();
      expect(performance.total_return).toBe(110);
    });
  });

  describe("calculateSharpeRatio", () => {
    it("should calculate Sharpe ratio", () => {
      const returns = [0.01, 0.02, -0.01, 0.015, 0.005];
      const sharpe = calculateSharpeRatio(returns);

      expect(sharpe).not.toBeNull();
      if (sharpe !== null) {
        expect(typeof sharpe).toBe("number");
      }
    });

    it("should return null for insufficient data", () => {
      const sharpe = calculateSharpeRatio([0.01]);
      expect(sharpe).toBeNull();
    });

    it("should handle all zero returns", () => {
      const sharpe = calculateSharpeRatio([0, 0, 0, 0]);
      expect(sharpe).toBe(0);
    });
  });

  describe("getPositionSummary", () => {
    it("should summarize positions correctly", () => {
      const positions: Partial<Position>[] = [
        {
          market_status: "open",
          shares_normalized: 50,
          label: "Yes",
          title: "Market 1",
        },
        {
          market_status: "open",
          shares_normalized: 30,
          label: "No",
          title: "Market 2",
        },
        {
          market_status: "closed",
          shares_normalized: 100,
          label: "Yes",
          title: "Market 3",
        },
      ];

      const summary = getPositionSummary(positions as Position[]);

      expect(summary.total_positions).toBe(3);
      expect(summary.open_positions).toBe(2);
      expect(summary.closed_positions).toBe(1);
      expect(summary.total_shares).toBe(180);
    });

    it("should return empty summary for no positions", () => {
      const summary = getPositionSummary([]);

      expect(summary.total_positions).toBe(0);
      expect(summary.open_positions).toBe(0);
      expect(summary.closed_positions).toBe(0);
      expect(summary.total_shares).toBe(0);
    });

    it("should group by side correctly", () => {
      const positions: Partial<Position>[] = [
        { label: "Yes", shares_normalized: 50 },
        { label: "Yes", shares_normalized: 30 },
        { label: "No", shares_normalized: 20 },
      ];

      const summary = getPositionSummary(positions as Position[]);

      expect(summary.by_side.Yes).toBe(2);
      expect(summary.by_side.No).toBe(1);
    });
  });
});
