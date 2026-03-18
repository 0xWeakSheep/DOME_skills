/**
 * Unit tests for activity-monitor skill.
 *
 * Tests for activityMonitor.ts functions using DOME API.
 */

import {
  describe,
  it,
  expect,
} from "vitest";

import {
  parseActivity,
  filterMergesSplitsRedeems,
  trackLargeTransactions,
  analyzeActivityPatterns,
  type Activity,
  type ActivityType,
} from "../../../packages/plugins/dome-data/skills/activity-monitor/scripts/activityMonitor.ts";

const API_KEY = process.env.DOME_API_KEY || "";
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("activityMonitor", () => {
  describe("parseActivity", () => {
    it("should parse complete activity data", () => {
      const rawActivity: Activity = {
        token_id:
          "123456789",
        side: "REDEEM",
        market_slug: "will-the-doj-charge-boeing",
        condition_id:
          "0x92e4b1b8e0621fab0537486e7d527322569d7a8fd394b3098ff4bb1d6e1c0bbd",
        shares: 187722726,
        shares_normalized: 187.722726,
        price: 1,
        block_number: 123456789,
        log_index: 42,
        tx_hash:
          "0x028baff23a90c10728606781d15077098ee93c991ea204aa52a0bd2869187574",
        title: "Will the DOJ charge Boeing?",
        timestamp: 1721263049,
        order_hash: "",
        user: "0xfd9c3e7f8c56eb4186372f343c873cce154b3873",
      };

      const parsed = parseActivity(rawActivity);

      expect(parsed.token_id).toBe("123456789");
      expect(parsed.side).toBe("REDEEM");
      expect(parsed.market_slug).toBe("will-the-doj-charge-boeing");
      expect(parsed.shares_normalized).toBe(187.722726);
      expect(parsed.price).toBe(1);
    });

    it("should handle partial activity data", () => {
      const rawActivity: Partial<Activity> = {
        token_id: "123",
        side: "MERGE",
        shares_normalized: 50,
      };

      const parsed = parseActivity(rawActivity as Activity);

      expect(parsed.token_id).toBe("123");
      expect(parsed.side).toBe("MERGE");
      expect(parsed.market_slug).toBeNull();
      expect(parsed.user).toBeNull();
    });
  });

  describe("filterMergesSplitsRedeems", () => {
    it("should filter by activity type", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "SPLIT", shares_normalized: 50 },
        { token_id: "3", side: "REDEEM", shares_normalized: 200 },
        { token_id: "4", side: "MERGE", shares_normalized: 75 },
      ];

      const filtered = filterMergesSplitsRedeems(activities as Activity[], {
        types: ["MERGE"],
      });

      expect(filtered.length).toBe(2);
      expect(filtered.every((a) => a.side === "MERGE")).toBe(true);
    });

    it("should filter by multiple types", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "SPLIT", shares_normalized: 50 },
        { token_id: "3", side: "REDEEM", shares_normalized: 200 },
      ];

      const filtered = filterMergesSplitsRedeems(activities as Activity[], {
        types: ["MERGE", "SPLIT"],
      });

      expect(filtered.length).toBe(2);
    });

    it("should filter by minimum shares", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "MERGE", shares_normalized: 500 },
        { token_id: "3", side: "MERGE", shares_normalized: 50 },
      ];

      const filtered = filterMergesSplitsRedeems(activities as Activity[], {
        minShares: 100,
      });

      expect(filtered.length).toBe(2);
    });

    it("should filter by market slug", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", market_slug: "market-a" },
        { token_id: "2", side: "MERGE", market_slug: "market-b" },
        { token_id: "3", side: "MERGE", market_slug: "market-a" },
      ];

      const filtered = filterMergesSplitsRedeems(activities as Activity[], {
        market_slug: "market-a",
      });

      expect(filtered.length).toBe(2);
      expect(filtered.every((a) => a.market_slug === "market-a")).toBe(true);
    });

    it("should filter by user", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", user: "0xuser1" },
        { token_id: "2", side: "MERGE", user: "0xuser2" },
        { token_id: "3", side: "MERGE", user: "0xuser1" },
      ];

      const filtered = filterMergesSplitsRedeems(activities as Activity[], {
        user: "0xuser1",
      });

      expect(filtered.length).toBe(2);
    });
  });

  describe("trackLargeTransactions", () => {
    it("should identify large transactions", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "MERGE", shares_normalized: 1000 },
        { token_id: "3", side: "MERGE", shares_normalized: 5000 },
        { token_id: "4", side: "MERGE", shares_normalized: 50 },
      ];

      const large = trackLargeTransactions(activities as Activity[], {
        threshold: 1000,
      });

      expect(large.length).toBe(2);
      expect(large[0].token_id).toBe("2");
      expect(large[1].token_id).toBe("3");
    });

    it("should calculate percentile correctly", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "MERGE", shares_normalized: 200 },
        { token_id: "3", side: "MERGE", shares_normalized: 300 },
        { token_id: "4", side: "MERGE", shares_normalized: 400 },
        { token_id: "5", side: "MERGE", shares_normalized: 500 },
      ];

      const large = trackLargeTransactions(activities as Activity[], {
        percentile: 80,
      });

      // 80th percentile means top 20%
      expect(large.length).toBe(1);
      expect(large[0].token_id).toBe("5");
    });

    it("should return empty array for no large transactions", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 10 },
        { token_id: "2", side: "MERGE", shares_normalized: 20 },
      ];

      const large = trackLargeTransactions(activities as Activity[], {
        threshold: 100,
      });

      expect(large.length).toBe(0);
    });
  });

  describe("analyzeActivityPatterns", () => {
    it("should analyze activity patterns", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100, timestamp: 1000 },
        { token_id: "2", side: "MERGE", shares_normalized: 200, timestamp: 2000 },
        { token_id: "3", side: "SPLIT", shares_normalized: 50, timestamp: 3000 },
        { token_id: "4", side: "REDEEM", shares_normalized: 300, timestamp: 4000 },
      ];

      const analysis = analyzeActivityPatterns(activities as Activity[]);

      expect(analysis.total_count).toBe(4);
      expect(analysis.type_distribution.MERGE).toBe(2);
      expect(analysis.type_distribution.SPLIT).toBe(1);
      expect(analysis.type_distribution.REDEEM).toBe(1);
      expect(analysis.total_shares).toBe(650);
    });

    it("should detect clustering", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100, timestamp: 1000 },
        { token_id: "2", side: "MERGE", shares_normalized: 100, timestamp: 1100 },
        { token_id: "3", side: "MERGE", shares_normalized: 100, timestamp: 1200 },
        { token_id: "4", side: "MERGE", shares_normalized: 100, timestamp: 5000 },
      ];

      const analysis = analyzeActivityPatterns(activities as Activity[], {
        clusterWindowSeconds: 500,
      });

      expect(analysis.clusters.length).toBeGreaterThan(0);
    });

    it("should identify suspicious patterns", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 2000, timestamp: 1000 },
        { token_id: "2", side: "MERGE", shares_normalized: 2000, timestamp: 1100 },
        { token_id: "3", side: "MERGE", shares_normalized: 2000, timestamp: 1200 },
      ];

      const analysis = analyzeActivityPatterns(activities as Activity[]);

      expect(analysis.suspicious_patterns.length).toBeGreaterThan(0);
    });

    it("should handle empty activities", () => {
      const analysis = analyzeActivityPatterns([]);

      expect(analysis.total_count).toBe(0);
      expect(analysis.total_shares).toBe(0);
      expect(analysis.clusters).toEqual([]);
    });

    it("should calculate average shares correctly", () => {
      const activities: Partial<Activity>[] = [
        { token_id: "1", side: "MERGE", shares_normalized: 100 },
        { token_id: "2", side: "MERGE", shares_normalized: 200 },
        { token_id: "3", side: "MERGE", shares_normalized: 300 },
      ];

      const analysis = analyzeActivityPatterns(activities as Activity[]);

      expect(analysis.avg_shares_per_activity).toBe(200);
    });
  });
});
