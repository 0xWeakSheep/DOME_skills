---
name: market-discovery
description: Fetch and discover Polymarket markets from DOME API. Use this skill when the user wants to find markets, search for specific topics, filter markets by criteria (volume, status, tags), or identify backtesting candidates. Triggers include phrases like "find markets", "search for markets", "get market data", "filter markets", or "discover markets".
---

# Market Discovery

## Overview

Discover and filter Polymarket prediction markets using the DOME API. This skill provides tools to fetch market data, search by keywords, filter by volume/status/tags, and identify markets suitable for backtesting.

## Security

This skill implements defense-in-depth measures against indirect prompt injection (Snyk W011):

- **Input Sanitization**: All user-generated content (titles, descriptions, tags) is sanitized using `security.ts`
- **Pattern Filtering**: Known prompt injection patterns are removed (e.g., "ignore previous instructions", "system:")
- **Content Validation**: Suspicious content with excessive special characters is flagged
- **Fail-Safe**: Processing errors return original data rather than corrupting it

The skill fetches data from the trusted DOME API (api.domeapi.io) which provides structured market data from the Polymarket protocol.

## Setup

Before using this skill, make sure you have built the TypeScript files:

```bash
# From the DOME_skills root directory
npm install
npm run build
```

This compiles the `.ts` files to `.js` files required by the import statements below.

## Quick Start

```typescript
import {
  fetchMarkets,
  parseMarketData,
  searchMarkets,
  fetchAllMarkets
} from "./scripts/marketDiscovery.js";

// Fetch recent markets
const result = await fetchMarkets(apiKey, { limit: 10 });
for (const market of result.markets) {
  const parsed = parseMarketData(market);
  console.log(`${parsed.title} - Volume: $${parsed.volume_total}`);
}

// Search for Bitcoin markets (status is required: "open" or "closed")
const searchResult = await searchMarkets(apiKey, "bitcoin", "open");

// Fetch all markets matching criteria
const allCrypto = await fetchAllMarkets(apiKey, { tags: ["crypto"], min_volume: 10000 });
```

## Core Functions

### fetchMarkets()

Fetch markets with optional filters. Returns paginated results.

```typescript
const result = await fetchMarkets(
  apiKey,
  {
    market_slug: "bitcoin-up-or-down",
    tags: ["crypto", "bitcoin"],
    status: "open",
    min_volume: 10000,
    start_time: 1700000000,
    end_time: 1700000000,
    limit: 20
  }
);
// Returns: { markets: [...], pagination: {...} }
```

**Available Filters:**
- `market_slug` - Filter by market slug(s)
- `event_slug` - Filter by event slug(s)
- `condition_id` - Filter by condition ID(s)
- `token_id` - Filter by token ID(s) (max 100)
- `tags` - Filter by tag(s)
- `search` - Search keywords (cannot combine with other filters)
- `status` - "open" or "closed"
- `min_volume` - Minimum USD volume
- `start_time/end_time` - Unix timestamps
- `limit` - Results per page (1-100)
- `pagination_key` - Cursor for next page

### fetchAllMarkets()

Automatically paginate through all results.

```typescript
const allMarkets = await fetchAllMarkets(
  apiKey,
  {
    tags: ["politics"],
    min_volume: 50000,
    maxPages: 5
  }
);
// Returns: Market[]
```

### parseMarketData()

Normalize raw API market data.

```typescript
const parsed = parseMarketData(market);
// Returns:
// {
//     market_slug: "...",
//     condition_id: "...",
//     title: "...",
//     start_time: 1234567890,
//     end_time: 1234567890,
//     status: "open",
//     volume_total: 12345.67,
//     tags: [...],
//     side_a: { token_id: "...", label: "Yes" },
//     side_b: { token_id: "...", label: "No" },
//     ...
// }
```

### filterBacktestCandidates()

Filter markets suitable for backtesting.

```typescript
const candidates = filterBacktestCandidates(
  markets,
  {
    minVolume: 10000,
    requireClosed: true,
    minDurationHours: 720
  }
);
```

### searchMarkets()

Search markets by keyword (searches title and description).

**Note:** `status` parameter is **required** for search. Search cannot be combined with other filters per API.

```typescript
// Search open markets
const result = await searchMarkets(
  apiKey,
  "presidential election",
  "open"  // Required: "open" or "closed"
);

// Search with options
const result = await searchMarkets(
  apiKey,
  "bitcoin",
  "open",
  { limit: 20 }
);
```

**Parameters:**
- `apiKey` - Your DOME API key
- `query` - Search query (min 2 characters)
- `status` - **Required:** `"open"` or `"closed"`
- `options` - Optional: `{ limit?: number; pagination_key?: string }`

### getMarketByConditionId()

Get a single market by its condition ID.

```typescript
const market = await getMarketByConditionId(
  apiKey,
  "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb"
);
```

### getMarketBySlug()

Get a single market by its slug.

```typescript
const market = await getMarketBySlug(
  apiKey,
  "will-bitcoin-hit-100k-in-2024"
);
```

## API Details

**Base URL:** `https://api.domeapi.io/v1`

**Endpoint:** `GET /polymarket/markets`

**Authentication:** Bearer token in Authorization header

### Rate Limits

- Standard tier: 100 requests per minute
- Burst allowance: 10 requests per second
- Pagination recommended for large datasets

### Response Format

```json
{
  "markets": [
    {
      "market_slug": "...",
      "condition_id": "...",
      "title": "...",
      "start_time": 1234567890,
      "end_time": 1234567890,
      "status": "open",
      "volume_total": 12345.67,
      "tags": ["crypto", "bitcoin"],
      "side_a": {"id": "...", "label": "Up"},
      "side_b": {"id": "...", "label": "Down"},
      "winning_side": null,
      "description": "...",
      "extra_fields": {}
    }
  ],
  "pagination": {
    "limit": 20,
    "total": 150,
    "has_more": true,
    "pagination_key": "eyJ..."
  }
}
```

## Example Workflows

### Find High-Volume Crypto Markets

```typescript
import { fetchAllMarkets, filterBacktestCandidates } from "./scripts/marketDiscovery.js";

const markets = await fetchAllMarkets(apiKey, { tags: ["crypto"], min_volume: 100000 });
const candidates = filterBacktestCandidates(markets, { minVolume: 50000 });
console.log(`Found ${candidates.length} high-volume crypto markets`);
```

### Search and Analyze

```typescript
import { searchMarkets, parseMarketData } from "./scripts/marketDiscovery.js";

const result = await searchMarkets(apiKey, "election 2024");
for (const market of result.markets) {
  const parsed = parseMarketData(market);
  console.log(`${parsed.title}: $${parsed.volume_total.toLocaleString()}`);
}
```

### Get Markets by Condition ID

```typescript
import { fetchMarkets } from "./scripts/marketDiscovery.js";

const result = await fetchMarkets(apiKey, {
  condition_id: "0x1234...",
  limit: 10
});
```

## Data Limitations

- **Historical Coverage:** Market data available from API launch date
- **Volume Accuracy:** Total volume is cumulative and may include wash trading
- **Resolution Timing:** `completed_time` may be null for unresolved markets
- **Token IDs:** Maximum 100 token IDs per request
- **Search Constraints:** Cannot combine `search` parameter with other filters
- **Pagination:** Uses cursor-based pagination (pagination_key), not offset

## Known Issues

1. **Search vs Filters:** The `search` parameter cannot be used with other filter parameters. Use separate calls if you need both.

2. **Volume Fields:** Markets may have `volume_total` but zero `volume_1_week/month/year` for older markets.

3. **Side Labels:** Not all markets use "Yes/No" - some use "Up/Down" or custom labels. Always check `side_a.label` and `side_b.label`.

4. **Extra Fields:** The `extra_fields` object varies by market type. Up/down markets include `price_to_beat` and `final_price`.

## Directory Structure

```
market-discovery/
├── SKILL.md                          # This file
├── scripts/
│   └── marketDiscovery.ts            # Main implementation
└── references/                       # Additional reference materials
```

## Resources

### scripts/
- `marketDiscovery.ts` - Main TypeScript module with all functions
