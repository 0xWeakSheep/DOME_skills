/**
 * Unit tests for event-discovery skill.
 *
 * Tests for eventDiscovery.ts functions using DOME API.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
} from "vitest";

// Import from skill
import {
  fetchEvents,
  fetchEventBySlug,
  getEventMarkets,
  filterHighVolumeEvents,
  parseEventData,
  DomeAPIError,
  type Event,
  type EventStatus,
} from "../../../packages/plugins/dome-data/skills/event-discovery/scripts/eventDiscovery.ts";

// Load API key from environment
const API_KEY = process.env.DOME_API_KEY || "";

// Skip tests if no API key
const describeIfApiKey = API_KEY ? describe : describe.skip;

describe("eventDiscovery", () => {
  describe("parseEventData", () => {
    it("should parse complete event data", () => {
      const rawEvent: Event = {
        event_slug: "presidential-election-2024",
        title: "Presidential Election 2024",
        subtitle: "Who will win the 2024 US Presidential Election?",
        status: "closed" as EventStatus,
        start_time: 1704067200,
        end_time: 1730851200,
        volume_fiat_amount: 3686335059.29,
        settlement_sources: "Associated Press",
        rules_url: null,
        image: "https://polymarket.com/images/election-2024.png",
        tags: ["politics", "elections"],
        market_count: 17,
        markets: [],
      };

      const parsed = parseEventData(rawEvent);

      expect(parsed.event_slug).toBe("presidential-election-2024");
      expect(parsed.title).toBe("Presidential Election 2024");
      expect(parsed.status).toBe("closed");
      expect(parsed.volume_fiat_amount).toBe(3686335059.29);
      expect(parsed.tags).toEqual(["politics", "elections"]);
      expect(parsed.market_count).toBe(17);
    });

    it("should handle missing optional fields", () => {
      const rawEvent: Partial<Event> = {
        event_slug: "test-event",
        title: "Test Event",
        status: "open" as EventStatus,
      };

      const parsed = parseEventData(rawEvent as Event);

      expect(parsed.event_slug).toBe("test-event");
      expect(parsed.subtitle).toBeNull();
      expect(parsed.tags).toEqual([]);
      expect(parsed.volume_fiat_amount).toBe(0);
    });
  });

  describe("filterHighVolumeEvents", () => {
    it("should filter by minimum volume", () => {
      const events: Partial<Event>[] = [
        { event_slug: "high", volume_fiat_amount: 1000000, status: "open" },
        { event_slug: "medium", volume_fiat_amount: 500000, status: "open" },
        { event_slug: "low", volume_fiat_amount: 1000, status: "open" },
      ];

      const filtered = filterHighVolumeEvents(events, {
        minVolume: 500000,
      });

      expect(filtered.length).toBe(2);
      expect(filtered[0].event_slug).toBe("high");
      expect(filtered[1].event_slug).toBe("medium");
    });

    it("should filter by status", () => {
      const events: Partial<Event>[] = [
        { event_slug: "closed1", volume_fiat_amount: 100000, status: "closed" },
        { event_slug: "open1", volume_fiat_amount: 100000, status: "open" },
        { event_slug: "closed2", volume_fiat_amount: 100000, status: "closed" },
      ];

      const filtered = filterHighVolumeEvents(events, {
        status: "closed",
      });

      expect(filtered.length).toBe(2);
      expect(filtered.every((e) => e.status === "closed")).toBe(true);
    });

    it("should return empty array when no matches", () => {
      const events: Partial<Event>[] = [
        { event_slug: "low", volume_fiat_amount: 100, status: "open" },
      ];

      const filtered = filterHighVolumeEvents(events);

      expect(filtered.length).toBe(0);
    });

    it("should filter by tags", () => {
      const events: Partial<Event>[] = [
        { event_slug: "crypto", volume_fiat_amount: 100000, status: "open", tags: ["crypto", "bitcoin"] },
        { event_slug: "politics", volume_fiat_amount: 100000, status: "open", tags: ["politics"] },
        { event_slug: "sports", volume_fiat_amount: 100000, status: "open", tags: ["sports"] },
      ];

      const filtered = filterHighVolumeEvents(events, {
        tags: ["crypto"],
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].event_slug).toBe("crypto");
    });
  });

  describe("getEventMarkets", () => {
    it("should extract markets from event", () => {
      const event: Event = {
        event_slug: "test-event",
        title: "Test Event",
        subtitle: null,
        status: "open",
        start_time: 1704067200,
        end_time: 1730851200,
        volume_fiat_amount: 100000,
        settlement_sources: null,
        rules_url: null,
        image: null,
        tags: [],
        market_count: 2,
        markets: [
          {
            market_slug: "market-1",
            title: "Market 1",
            condition_id: "0x1234",
            status: "open",
            volume_total: 50000,
          },
          {
            market_slug: "market-2",
            title: "Market 2",
            condition_id: "0x5678",
            status: "open",
            volume_total: 50000,
          },
        ],
      };

      const markets = getEventMarkets(event);

      expect(markets.length).toBe(2);
      expect(markets[0].market_slug).toBe("market-1");
      expect(markets[1].market_slug).toBe("market-2");
    });

    it("should return empty array when no markets", () => {
      const event: Partial<Event> = {
        event_slug: "test-event",
        markets: undefined,
      };

      const markets = getEventMarkets(event as Event);

      expect(markets).toEqual([]);
    });
  });

  describeIfApiKey("API Integration Tests", () => {
    it("fetchEvents should return events", async () => {
      const result = await fetchEvents(API_KEY, { limit: 5 });

      expect(result.events).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events.length).toBeLessThanOrEqual(5);
    });

    it("fetchEvents should filter by status", async () => {
      const result = await fetchEvents(API_KEY, {
        status: "open",
        limit: 5,
      });

      for (const event of result.events) {
        expect(event.status).toBe("open");
      }
    });

    it("fetchEvents should filter by tags", async () => {
      const result = await fetchEvents(API_KEY, {
        tags: ["crypto"],
        limit: 5,
      });

      expect(Array.isArray(result.events)).toBe(true);
    });

    it("fetchEventBySlug should return single event", async () => {
      // First get an event slug from list
      const listResult = await fetchEvents(API_KEY, { limit: 1 });
      if (listResult.events.length === 0) {
        return;
      }

      const slug = listResult.events[0].event_slug;
      const result = await fetchEventBySlug(API_KEY, slug);

      expect(result).not.toBeNull();
      expect(result?.event_slug).toBe(slug);
    });

    it("fetchEventBySlug should return null for non-existent", async () => {
      const result = await fetchEventBySlug(API_KEY, "non-existent-slug-12345");
      expect(result).toBeNull();
    });
  });

  describe("Validation", () => {
    it("should throw on invalid limit", async () => {
      await expect(
        fetchEvents(API_KEY, { limit: 200 })
      ).rejects.toThrow();
    });

    it("should throw on invalid API key", async () => {
      await expect(fetchEvents("invalid_key", { limit: 5 })).rejects.toThrow(
        DomeAPIError
      );
    });
  });
});
