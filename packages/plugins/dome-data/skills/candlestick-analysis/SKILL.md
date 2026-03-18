---
name: candlestick-analysis
description: Analyze historical candlestick data for Polymarket prediction markets. Use this skill when users need to fetch OHLCV data, calculate technical indicators (SMA, EMA, volatility), detect price trends, support/resistance levels, or perform time-series analysis on market prices. Trigger for requests involving price history, chart data, technical analysis, or market trend detection.
---

# Candlestick Analysis

## Overview

This skill enables fetching and analyzing historical candlestick (OHLCV) data from Polymarket prediction markets via the DOME API. It provides tools for technical analysis including moving averages, volatility calculation, and trend detection.

## Quick Start

```typescript
import {
  fetchCandlesticks,
  calculateSMA,
  calculateEMA,
  calculateVolatility,
  detectPriceTrends,
  formatCandlestickSummary
} from "./scripts/candlestickAnalysis.js";

// Fetch 1-hour candlesticks for the past week
const endTime = Math.floor(Date.now() / 1000);
const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago

const seriesList = await fetchCandlesticks(
  apiKey,
  "0x...",      // condition_id
  startTime,
  endTime,
  60            // 1 hour interval
);

// Analyze each side (Yes/No)
for (const series of seriesList) {
  const closes = series.candlesticks.map(c => c.close_price);

  // Calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const ema20 = calculateEMA(closes, 20);
  const volatility = calculateVolatility(closes, 20);

  // Detect trends
  const trends = detectPriceTrends(series.candlesticks);

  console.log(`Side: ${series.token_metadata.side}`);
  console.log(`Trend: ${trends.trend} (strength: ${trends.strength})`);
  console.log(`Support levels: ${trends.support_levels}`);
  console.log(`Resistance levels: ${trends.resistance_levels}`);
}
```

## API Details

### Base URL
```
https://api.domeapi.io/v1
```

### Endpoint
```
GET /polymarket/candlesticks/{condition_id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `condition_id` | string | Yes | Market condition ID (path parameter) |
| `start_time` | number | Yes | Unix timestamp (seconds) for start of range |
| `end_time` | number | Yes | Unix timestamp (seconds) for end of range |
| `interval` | number | No | Interval: 1 (1m), 60 (1h), 1440 (1d). Default: 1 |

### Interval Limits

| Interval | Description | Maximum Range |
|----------|-------------|---------------|
| 1 | 1 minute | 1 week |
| 60 | 1 hour | 1 month |
| 1440 | 1 day | 1 year |

Exceeding these limits will throw a `ValidationError` before the API call is made.

## Data Structure

### Response Format

The API returns an array of `CandlestickSeries` objects, one for each market side (typically Yes/No).

### Candlestick Fields

| Field | Type | Description |
|-------|------|-------------|
| `end_period_ts` | number | Unix timestamp for period end |
| `open_price` | number | Opening price |
| `high_price` | number | High price |
| `low_price` | number | Low price |
| `close_price` | number | Closing price |
| `volume` | number | Trading volume |

### Token Metadata

| Field | Description |
|-------|-------------|
| `token_id` | Unique token identifier |
| `side` | Outcome label (Yes, No, etc.) |

## Functions Reference

### fetchCandlesticks(apiKey, conditionId, startTime, endTime, interval)

Fetch candlestick data from the DOME API.

**Returns:** `CandlestickSeries[]` - One series per market side

**Throws:**
- `ValidationError`: If time range exceeds interval limits
- `DomeAPIError`: If API request fails

### parseCandlestickData(response)

Parse raw API response into structured `CandlestickSeries` objects.

**Returns:** `CandlestickSeries[]`

### calculateSMA(prices, period)

Calculate Simple Moving Average.

**Returns:** `(number | null)[]` - SMA values, first (period-1) are null

### calculateEMA(prices, period)

Calculate Exponential Moving Average.

**Returns:** `(number | null)[]` - EMA values, first (period-1) are null

### calculateVolatility(prices, period)

Calculate rolling standard deviation as volatility measure.

**Returns:** `(number | null)[]` - Volatility values, first (period-1) are null

### detectPriceTrends(candlesticks, window)

Detect support/resistance levels and price trends.

**Returns:** `TrendResult` with:
- `support_levels`: List of detected support prices
- `resistance_levels`: List of detected resistance prices
- `trend`: 'uptrend', 'downtrend', or 'sideways'
- `strength`: 0.0 to 1.0
- `price_range`: Min/max prices

### formatCandlestickSummary(series)

Create a summary of a candlestick series with statistics.

**Returns:** `CandlestickSummary` with side, data points, price summary, and volume summary

## Example Workflows

### Fetch and Analyze Recent Price Action

```typescript
// Last 24 hours with 1-hour candles
const now = Math.floor(Date.now() / 1000);
const yesterday = now - (24 * 60 * 60);

const seriesList = await fetchCandlesticks(
  apiKey,
  "0x...",
  yesterday,
  now,
  60
);

for (const series of seriesList) {
  const trends = detectPriceTrends(series.candlesticks);
  console.log(`${series.token_metadata.side}: ${trends.trend}`);
}
```

### Calculate Technical Indicators

```typescript
const closes = series.candlesticks.map(c => c.close_price);

// Multiple timeframes
const smaShort = calculateSMA(closes, 7);
const smaLong = calculateSMA(closes, 30);
const ema = calculateEMA(closes, 20);
const vol = calculateVolatility(closes, 14);

// Find crossover points
for (let i = 1; i < closes.length; i++) {
  if (smaShort[i] && smaLong[i] && smaShort[i-1] && smaLong[i-1]) {
    if (smaShort[i-1] <= smaLong[i-1] && smaShort[i] > smaLong[i]) {
      console.log(`Golden cross at index ${i}`);
    }
  }
}
```

### Compare Yes vs No Price Action

```typescript
const seriesList = await fetchCandlesticks(apiKey, conditionId, startTime, endTime, 60);

const summaries: Record<string, CandlestickSummary> = {};
for (const series of seriesList) {
  summaries[series.token_metadata.side] = formatCandlestickSummary(series);
}

// Compare price changes
if (summaries.Yes && summaries.No) {
  const yesChange = summaries.Yes.price_summary.change_pct;
  const noChange = summaries.No.price_summary.change_pct;
  console.log(`Yes changed: ${yesChange}%, No changed: ${noChange}%`);
}
```

## Data Limitations

1. **Time Range Constraints**: Each interval has maximum time ranges that cannot be exceeded:
   - 1-minute data: Maximum 1 week
   - 1-hour data: Maximum 1 month
   - 1-day data: Maximum 1 year

2. **Market Availability**: Data is only available for markets that have been active on Polymarket.

3. **Price Precision**: Prices are returned as decimals (0.0 to 1.0 representing 0% to 100% probability).

4. **Timestamp Resolution**: All timestamps are in seconds (Unix epoch time).

## Error Handling

```typescript
import { fetchCandlesticks, ValidationError, DomeAPIError } from "./scripts/candlestickAnalysis.js";

// Handle validation errors
try {
  const data = await fetchCandlesticks(apiKey, conditionId, startTime, endTime, interval);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Invalid range: ${error.message}`);
  } else if (error instanceof DomeAPIError) {
    if (error.statusCode === 400) {
      console.log("Bad request - check parameters");
    } else if (error.statusCode === 401) {
      console.log("Invalid API key");
    } else {
      console.log(`API error: ${error.message}`);
    }
  }
}
```

## Directory Structure

```
candlestick-analysis/
├── SKILL.md                          # This file
├── scripts/
│   └── candlestickAnalysis.ts        # Main implementation
└── references/                       # Additional reference materials
```

## Resources

### scripts/
- `candlestickAnalysis.ts` - Main TypeScript module with all functions
