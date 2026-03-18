---
name: orderbook-analysis
description: Analyze Polymarket orderbook depth, liquidity, spreads, and price impact. Use this skill when the user wants to analyze market microstructure, calculate spreads, check liquidity, or estimate price impact for trades. Triggers include phrases like "orderbook analysis", "market depth", "bid ask spread", "liquidity analysis", "price impact", or "slippage calculation".
---

# Orderbook Analysis

## Overview

Analyze market microstructure including orderbook snapshots, bid-ask spreads, liquidity depth, and price impact calculations for optimal trade execution.

## Setup

```bash
npm install
npm run build
```

## Quick Start

```typescript
import {
  fetchOrderbookHistory,
  fetchMarketPrice,
  calculateSpread,
  analyzeLiquidity,
  detectPriceImpact,
  getLiquidityProfile
} from "./scripts/orderbookAnalysis.js";

// Get current orderbook
const history = await fetchOrderbookHistory(apiKey, tokenId, { limit: 1 });
const snapshot = parseOrderbookSnapshot(history.snapshots[0]);

// Calculate spread
const spread = calculateSpread(snapshot.asks, snapshot.bids);
console.log(`Spread: ${spread.spread_percentage}%`);

// Analyze liquidity
const liquidity = analyzeLiquidity(snapshot.asks, snapshot.bids);

// Check price impact for 1000 share buy
const impact = detectPriceImpact(snapshot.asks, "buy", 1000);
console.log(`Price impact: ${impact.price_impact_percent}%`);
```

## Core Functions

### fetchOrderbookHistory()

Fetch historical orderbook snapshots.

```typescript
const result = await fetchOrderbookHistory(apiKey, tokenId, {
  start_time: 1760470000000,  // Milliseconds
  end_time: 1760480000000,
  limit: 100
});
```

### fetchMarketPrice()

Fetch current or historical market price.

```typescript
// Current price
const price = await fetchMarketPrice(apiKey, tokenId);

// Historical price
const historical = await fetchMarketPrice(apiKey, tokenId, 1762164600);
```

### parseOrderbookSnapshot()

Parse raw orderbook data with sorting.

```typescript
const parsed = parseOrderbookSnapshot(snapshot);
// Returns: { asks, bids, midPrice, spread, timestamp, ... }
```

### calculateSpread()

Calculate bid-ask spread metrics.

```typescript
const spread = calculateSpread(asks, bids);
// Returns: { best_ask, best_bid, spread_absolute, spread_percentage }
```

### analyzeLiquidity()

Analyze liquidity at different depth levels.

```typescript
const liquidity = analyzeLiquidity(asks, bids);
// Returns: {
//   total_ask_liquidity,
//   total_bid_liquidity,
//   depth_2_percent,
//   depth_5_percent,
//   imbalance
// }
```

### detectPriceImpact()

Calculate price impact for a trade.

```typescript
const impact = detectPriceImpact(orders, "buy", 1000);
// Returns: {
//   executable,
//   average_price,
//   price_impact_percent,
//   filled_size,
//   missing_liquidity
// }
```

### getLiquidityProfile()

Generate comprehensive liquidity profile.

```typescript
const profile = getLiquidityProfile(asks, bids);
// Returns: {
//   spread,
//   ask_levels,
//   bid_levels,
//   optimal_trade_size,
//   recommended_max_trade,
//   liquidity_score
// }
```

### analyzeOrderbookChanges()

Track orderbook changes over time.

```typescript
const changes = analyzeOrderbookChanges(parsedSnapshots);
// Returns: Array of { timestamp, spread_change, liquidity_change, ... }
```

## Data Limitations

- Orderbook history available from October 14th, 2025
- Timestamps are in **milliseconds** (not seconds)
- Maximum 200 snapshots per request
- When fetching latest orderbook without time range, pagination is ignored
