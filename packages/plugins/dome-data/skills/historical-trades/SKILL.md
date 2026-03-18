---
name: historical-trades
description: Fetch and analyze historical Polymarket trade data. Use this skill when users need to retrieve trade history, analyze trading patterns, calculate volume statistics, or aggregate trades by time periods for specific markets, tokens, or users.
---

# Historical Trades Skill

Fetch and analyze historical trade data from Polymarket via the DOME API.

## Quick Start

```typescript
import {
  fetchTrades,
  fetchAllTrades,
  parseTradeData,
  calculateTradeStats,
  aggregateTradesByTime
} from "./scripts/historicalTrades.js";

// Fetch recent trades for a market
const result = await fetchTrades(
  apiKey,
  {
    market_slug: "bitcoin-up-or-down-july-25-8pm-et",
    limit: 100
  }
);

// Get all trades with pagination
const allTrades = await fetchAllTrades(
  apiKey,
  {
    token_id: "58519484510520807142687824915233722607092670035910114837910294451210534222702"
  }
);

// Calculate statistics
const stats = calculateTradeStats(allTrades);
console.log(`Total volume: ${stats.total_volume}`);
console.log(`Buy/Sell ratio: ${stats.buy_sell_ratio}`);

// Aggregate by hour
const hourly = aggregateTradesByTime(allTrades, 3600);
```

## API Details

### Base URL
```
https://api.domeapi.io/v1
```

### Endpoint
```
GET /polymarket/orders
```

### Authentication
Bearer token in Authorization header.

### Rate Limits
- Standard tier: 100 requests per minute
- Use pagination for large datasets

## Core Functions

### fetchTrades()

Fetch historical trades with filters.

```typescript
const result = await fetchTrades(
  apiKey,
  {
    market_slug: "will-bitcoin-hit-100k",  // or use token_id or condition_id
    start_time: 1700000000,
    end_time: 1700086400,
    limit: 1000
  }
);
```

**Parameters:**
- `market_slug` - Filter by market slug
- `token_id` - Filter by token ID
- `condition_id` - Filter by condition ID
- `user` - Filter by wallet address
- `start_time/end_time` - Unix timestamps (seconds)
- `limit` - Results per request (1-1000)

**Note:** Only ONE of market_slug, token_id, or condition_id can be used at a time.

### fetchAllTrades()

Fetch all trades with automatic pagination.

```typescript
const allTrades = await fetchAllTrades(
  apiKey,
  {
    market_slug: "will-bitcoin-hit-100k",
    maxTrades: 5000
  }
);
```

### parseTradeData()

Normalize raw trade data.

```typescript
const parsed = parseTradeData(trade);
// Returns:
// {
//     token_id: "...",
//     side: "BUY" | "SELL",
//     market_slug: "...",
//     shares_normalized: 10.5,
//     price: 0.65,
//     timestamp: Date,
//     ...
// }
```

### calculateTradeStats()

Calculate trading statistics.

```typescript
const stats = calculateTradeStats(trades);
// Returns:
// {
//     total_trades: 100,
//     total_volume: 50000,
//     buy_count: 60,
//     sell_count: 40,
//     buy_volume: 35000,
//     sell_volume: 15000,
//     buy_sell_ratio: 2.33,
//     avg_price: 0.62,
//     sentiment: "bullish"
// }
```

### aggregateTradesByTime()

Aggregate trades into time buckets.

```typescript
const buckets = aggregateTradesByTime(trades, 3600); // 1 hour
// Returns: Record<number, TimeBucket> - Object with timestamps as keys
```

## Example Workflows

### Analyze Market Trading Activity

```typescript
const trades = await fetchAllTrades(apiKey, {
  market_slug: "will-bitcoin-hit-100k-in-2024"
});

const stats = calculateTradeStats(trades);
console.log(`Buy/Sell Ratio: ${stats.buy_sell_ratio.toFixed(2)}`);
console.log(`Sentiment: ${stats.sentiment}`);
```

### Hourly Volume Analysis

```typescript
const trades = await fetchAllTrades(apiKey, {
  condition_id: "0x4567...",
  start_time: 1704153600,
  end_time: 1704240000
});

const hourly = aggregateTradesByTime(trades, 3600);
for (const [timestamp, bucket] of Object.entries(hourly)) {
  console.log(`${new Date(parseInt(timestamp) * 1000)}: ${bucket.count} trades`);
}
```

### Track User Trading Activity

```typescript
const userTrades = await fetchTrades(apiKey, {
  market_slug: "will-bitcoin-hit-100k-in-2024",
  user: "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b",
  limit: 500
});
```

## Data Limitations

| Parameter | Limit | Notes |
|-----------|-------|-------|
| limit | 1-1000 per request | Default: 100 |
| Filter exclusivity | Only one filter type | market_slug OR token_id OR condition_id |
| Time range | Unix timestamps | Seconds since epoch |
| Pagination | Cursor-based | Use pagination_key |

## Directory Structure

```
historical-trades/
├── SKILL.md                          # This file
├── scripts/
│   └── historicalTrades.ts           # Main implementation
└── references/                       # Additional reference materials
```

## Resources

### scripts/
- `historicalTrades.ts` - Main TypeScript module with all functions
