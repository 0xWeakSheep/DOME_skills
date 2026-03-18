---
name: event-discovery
description: Fetch and discover Polymarket events from DOME API. Use this skill when the user wants to find events (groups of related markets), search for specific event topics, filter events by criteria (volume, status, tags), or get markets within an event. Triggers include phrases like "find events", "get event markets", "discover events", "event analysis", or "events by category".
---

# Event Discovery

## Overview

Discover and filter Polymarket events using the DOME API. Events aggregate multiple related markets under a single topic (e.g., "Presidential Election 2024" contains multiple candidate markets).

## Security

This skill implements defense-in-depth measures against indirect prompt injection (Snyk W011):

- **Input Sanitization**: All user-generated content (titles, subtitles, tags) is sanitized using `security.ts`
- **Pattern Filtering**: Known prompt injection patterns are removed (e.g., "ignore previous instructions", "system:")
- **Content Validation**: Suspicious content with excessive special characters is flagged
- **Fail-Safe**: Processing errors return original data rather than corrupting it

The skill fetches data from the trusted DOME API (api.domeapi.io) which provides structured event data from the Polymarket protocol.

## Setup

Before using this skill, make sure you have built the TypeScript files:

```bash
# From the DOME_skills root directory
npm install
npm run build
```

## Quick Start

```typescript
import {
  fetchEvents,
  fetchEventBySlug,
  getEventMarkets,
  filterHighVolumeEvents
} from "./scripts/eventDiscovery.js";

// Fetch recent events
const result = await fetchEvents(apiKey, { limit: 10, include_markets: true });
for (const event of result.events) {
  console.log(`${event.title} - Markets: ${event.market_count}`);
}

// Get specific event with markets
const event = await fetchEventBySlug(apiKey, "presidential-election-2024");
const markets = getEventMarkets(event);

// Filter high-volume events
const allEvents = await fetchAllEvents(apiKey, { tags: ["crypto"] });
const highVolume = filterHighVolumeEvents(allEvents, { minVolume: 1000000 });
```

## Core Functions

### fetchEvents()

Fetch events with optional filters.

```typescript
const result = await fetchEvents(
  apiKey,
  {
    event_slug: "presidential-election-2024",
    tags: ["politics", "elections"],
    status: "open",
    include_markets: true,
    limit: 20
  }
);
// Returns: { events: [...], pagination: {...} }
```

### fetchEventBySlug()

Get a single event by its slug with all markets.

```typescript
const event = await fetchEventBySlug(
  apiKey,
  "presidential-election-2024"
);
```

### getEventMarkets()

Extract markets from an event object.

```typescript
const markets = getEventMarkets(event);
// Returns: EventMarket[]
```

### filterHighVolumeEvents()

Filter events by volume, status, or tags.

```typescript
const filtered = filterHighVolumeEvents(
  events,
  {
    minVolume: 1000000,
    status: "open",
    tags: ["crypto"],
    minMarkets: 2
  }
);
```

### calculateEventStats()

Calculate statistics for an event.

```typescript
const stats = calculateEventStats(event);
// Returns: { total_volume, total_markets, avg_volume_per_market, ... }
```

## Event Data Structure

The `Event` object returned by the API contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `event_slug` | `string` | Unique identifier for the event |
| `title` | `string` | Event title |
| `subtitle` | `string \| null` | Event description/subtitle |
| `status` | `"open" \| "closed"` | Current event status |
| `start_time` | `number` | Unix timestamp when event started |
| `end_time` | `number` | Unix timestamp when event ends |
| `volume_fiat_amount` | `number` | **Total USD volume across all markets** |
| `market_count` | `number` | Number of markets in this event |
| `markets` | `EventMarket[] \| null` | Array of markets (when `include_markets=true`) |
| `tags` | `string[]` | Tags/categories for the event |
| `image` | `string \| null` | URL to event image |

**Note:** The volume field is `volume_fiat_amount`, not `volume`.

## Data Limitations

- Maximum 100 events per request
- Event data ordered by total volume (highest first)
- Markets included only when `include_markets=true`
