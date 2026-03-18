---
name: wallet-analytics
description: Analyze Polymarket wallet performance, positions, and trading activity. Use this skill when the user wants to analyze a trader's performance, get wallet positions, calculate PnL, or identify smart money wallets. Triggers include phrases like "analyze wallet", "trading performance", "wallet PnL", "positions", "smart money", or "trader analysis".
---

# Wallet Analytics

## Overview

Analyze Polymarket wallet performance including trading metrics, positions, realized PnL, and performance indicators like Sharpe ratio and win rate.

## Security

This skill implements defense-in-depth measures against indirect prompt injection (Snyk W011):

- **Input Sanitization**: All user-generated content (handles, pseudonyms, position titles, labels) is sanitized using `security.ts`
- **Pattern Filtering**: Known prompt injection patterns are removed (e.g., "ignore previous instructions", "system:")
- **Content Validation**: Suspicious content with excessive special characters is flagged
- **Fail-Safe**: Processing errors return original data rather than corrupting it

The skill fetches data from the trusted DOME API (api.domeapi.io) which provides structured wallet and position data from the Polymarket protocol.

## Setup

```bash
npm install
npm run build
```

## Quick Start

```typescript
import {
  fetchWalletInfo,
  fetchPositions,
  fetchWalletPnL,
  calculateTradingPerformance,
  getPositionSummary
} from "./scripts/walletAnalytics.js";

// Get wallet info with metrics
const wallet = await fetchWalletInfo(apiKey, {
  proxy: "0x...",
  with_metrics: true
});

// Get current positions
const positions = await fetchAllPositions(apiKey, wallet.proxy);

// Get PnL history
const pnl = await fetchWalletPnL(apiKey, wallet.proxy, {
  granularity: "day"
});

// Calculate performance
const performance = calculateTradingPerformance(pnl.pnl_over_time);
console.log(`Sharpe ratio: ${performance.sharpe_ratio}`);
```

## Core Functions

### fetchWalletInfo()

Fetch wallet information with optional trading metrics.

```typescript
const wallet = await fetchWalletInfo(apiKey, {
  eoa: "0x...",        // Or proxy, or handle
  with_metrics: true,
  start_time: 1700000000,
  end_time: 1700000000
});
```

### fetchPositions()

Fetch wallet positions with pagination.

```typescript
const result = await fetchPositions(apiKey, walletAddress, {
  limit: 100
});
// Returns: { wallet_address, positions: [...], pagination }
```

### fetchAllPositions()

Fetch all positions with automatic pagination.

```typescript
const positions = await fetchAllPositions(apiKey, walletAddress, {
  maxPages: 5
});
```

### fetchWalletPnL()

Fetch realized PnL with time granularity.

```typescript
const pnl = await fetchWalletPnL(apiKey, walletAddress, {
  granularity: "day",   // "day" | "week" | "month" | "year" | "all"
  start_time: 1700000000,
  end_time: 1700000000
});
```

### calculateTradingPerformance()

Calculate comprehensive trading metrics.

```typescript
const performance = calculateTradingPerformance(pnlPeriods);
// Returns: {
//   total_return,
//   max_drawdown,
//   win_rate,
//   profitable_days,
//   sharpe_ratio,
//   average_daily_return,
//   volatility
// }
```

### calculateSharpeRatio()

Calculate risk-adjusted returns.

```typescript
const sharpe = calculateSharpeRatio(returns, riskFreeRate);
```

### getPositionSummary()

Summarize positions by status and side.

```typescript
const summary = getPositionSummary(positions);
// Returns: { total_positions, open_positions, closed_positions, by_side, ... }
```

### analyzeSmartMoneyIndicators()

Analyze smart money characteristics.

```typescript
const indicators = analyzeSmartMoneyIndicators(parsedWallet, performance);
// Returns: { volume_percentile, consistency_score, overall_score, ... }
```

## Important Note

PnL data shows **realized gains only** - from confirmed sells or redeems. Unrealized gains from open positions are not included until the market is redeemed.
