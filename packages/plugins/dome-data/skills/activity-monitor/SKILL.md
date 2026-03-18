---
name: activity-monitor
description: Monitor and analyze Polymarket trading activity including MERGES, SPLITS, and REDEEMS. Use this skill when the user wants to track large transactions, analyze activity patterns, detect suspicious behavior, or monitor market closing signals. Triggers include phrases like "track activity", "monitor transactions", "large trades", "activity patterns", or "market closing signals".
---

# Activity Monitor

## Overview

Monitor and analyze trading activity on Polymarket including token merges, splits, and redemptions. Useful for tracking whale movements, detecting coordinated activity, and identifying market closing signals.

## Security

This skill implements defense-in-depth measures against indirect prompt injection (Snyk W011):

- **Input Sanitization**: All user-generated content (activity titles, market slugs) is sanitized using `security.ts`
- **Pattern Filtering**: Known prompt injection patterns are removed (e.g., "ignore previous instructions", "system:")
- **Content Validation**: Suspicious content with excessive special characters is flagged
- **Fail-Safe**: Processing errors return original data rather than corrupting it

The skill fetches data from the trusted DOME API (api.domeapi.io) which provides structured activity data from the Polymarket protocol.

## Setup

```bash
npm install
npm run build
```

## Quick Start

```typescript
import {
  fetchActivity,
  trackLargeTransactions,
  analyzeActivityPatterns,
  detectMarketClosingSignals
} from "./scripts/activityMonitor.js";

// Fetch recent activity
const result = await fetchActivity(apiKey, { limit: 100 });

// Track large transactions
const large = trackLargeTransactions(result.activities, { threshold: 10000 });

// Analyze patterns
const analysis = analyzeActivityPatterns(result.activities);
console.log(`Suspicious patterns: ${analysis.suspicious_patterns.length}`);

// Detect market closing signals
const signals = detectMarketClosingSignals(result.activities);
```

## Core Functions

### fetchActivity()

Fetch MERGE, SPLIT, REDEEM activities.

```typescript
const result = await fetchActivity(apiKey, {
  user: "0x...",
  market_slug: "will-bitcoin-hit-100k",
  start_time: 1700000000,
  limit: 1000
});
```

### trackLargeTransactions()

Identify large transactions by threshold or percentile.

```typescript
// By fixed threshold
const large = trackLargeTransactions(activities, { threshold: 5000 });

// By percentile (top 10%)
const top10 = trackLargeTransactions(activities, { percentile: 90 });
```

### analyzeActivityPatterns()

Analyze activity patterns and detect anomalies.

```typescript
const analysis = analyzeActivityPatterns(activities, {
  clusterWindowSeconds: 300
});
// Returns: { total_count, type_distribution, clusters, suspicious_patterns, ... }
```

### detectMarketClosingSignals()

Detect potential market closing signals from redemption patterns.

```typescript
const signals = detectMarketClosingSignals(activities);
// Returns: MarketClosingSignal[] sorted by confidence
```

### filterMergesSplitsRedeems()

Filter activities by type, size, market, or user.

```typescript
const redeems = filterMergesSplitsRedeems(activities, {
  types: ["REDEEM"],
  minShares: 1000,
  market_slug: "specific-market"
});
```

## Activity Types

- **MERGE** - Combining Yes and No tokens back into collateral
- **SPLIT** - Splitting collateral into Yes and No tokens
- **REDEEM** - Redeeming winning tokens after market resolution

## Use Cases

- **Whale Watching**: Track large transactions above thresholds
- **Market Intelligence**: Detect unusual activity patterns
- **Closing Signals**: Identify when markets may be resolving
- **Coordinated Activity**: Detect potential manipulation
