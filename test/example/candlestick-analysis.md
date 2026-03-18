# Candlestick Analysis Skill - Example Scenarios

This document provides example scenarios for the candlestick-analysis skill, including trigger phrases, input conditions, and expected outputs.

## Scenario 1: Fetching OHLCV Data

### Context
Researcher needs historical price data for technical analysis.

### Trigger Phrases
- "Get candlestick data for market 0x1234..."
- "Fetch price history with 1-hour intervals"
- "Show me OHLCV data for Bitcoin market"
- "Pull K-line data for the past week"

### Input Conditions
```typescript
{
  condition_id: "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb",
  start_time: 1704067200, // 2024-01-01
  end_time: 1706745600,   // 2024-02-01
  interval: 60            // 1 hour
}
```

### Expected Output
Candlestick data with:
- Open, High, Low, Close prices
- Volume per period
- Timestamps
- Yes/No side data

### Anti-Patterns (Should NOT trigger this skill)
- "Show me individual trades" (historical-trades skill)
- "Get current market price" (real-time data, not historical)
- "Analyze orderbook depth" (orderbook-replay skill)

---

## Scenario 2: Technical Indicator Calculation

### Context
Quant analyst wants to calculate moving averages and volatility.

### Trigger Phrases
- "Calculate SMA for this market"
- "Show me 20-day moving average"
- "Compute volatility indicators"
- "Generate EMA crossover signals"

### Input Conditions
```typescript
{
  condition_id: "0x1234...",
  start_time: 1700000000,
  end_time: 1704000000,
  interval: 1440, // 1 day
  indicators: ["SMA", "EMA", "volatility"]
}
```

### Expected Output
Technical analysis results:
- SMA values for specified periods
- EMA values with multipliers
- Volatility (standard deviation)
- Crossover signals

---

## Scenario 3: Trend Detection

### Context
Identify market trends and support/resistance levels.

### Trigger Phrases
- "Detect price trends for this market"
- "Find support and resistance levels"
- "Is this market trending up or down?"
- "Analyze price momentum"

### Input Conditions
```typescript
{
  condition_id: "0x1234...",
  start_time: 1700000000,
  end_time: 1704000000,
  interval: 60,  // 1 hour
  analysis: "trend_detection",
  support_resistance_window: 5
}
```

### Expected Output
Trend analysis:
- Trend direction (up/down/sideways)
- Trend strength (0-1 scale)
- Support level prices
- Resistance level prices
- Price range statistics

---

## Scenario 4: Comparing Yes vs No Prices

### Context
Analyze the relationship between Yes and No token prices.

### Trigger Phrases
- "Compare Yes and No price action"
- "Show both sides of the market"
- "Analyze price divergence between outcomes"
- "Plot Yes vs No prices"

### Input Conditions
```typescript
{
  condition_id: "0x1234...",
  start_time: 1700000000,
  end_time: 1704000000,
  interval: 1440, // 1 day
  include_both_sides: true
}
```

### Expected Output
Comparative analysis:
- Yes token price series
- No token price series
- Price correlation
- Divergence points
- Summary statistics for both sides

---

## Data Limitations Reference

| Interval | Code | Max Range | Best For |
|----------|------|-----------|----------|
| 1 minute | 1 | 1 week | High-frequency analysis |
| 1 hour | 60 | 1 month | Technical analysis |
| 1 day | 1440 | 1 year | Long-term trends |

## Common Error Cases

1. **Exceeding time range**: 1m interval with 2 weeks → ValidationError
2. **Invalid interval**: Using interval=30 → ValidationError (not supported)
3. **Start after end**: start_time > end_time → ValidationError
4. **Invalid condition ID**: Malformed ID → API 400 error

## Example Workflow

### Complete Technical Analysis

```typescript
// Step 1: Fetch candlesticks
const series = await fetchCandlesticks(
  apiKey,
  conditionId,
  startTime,
  endTime,
  60 // 1 hour
);

// Step 2: Process each side (Yes/No)
for (const s of series) {
  const closes = s.candlesticks.map(c => c.close_price);

  // Step 3: Calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const ema20 = calculateEMA(closes, 20);
  const volatility = calculateVolatility(closes, 20);

  // Step 4: Detect trends
  const trends = detectPriceTrends(s.candlesticks);

  // Step 5: Generate summary
  const summary = formatCandlestickSummary(s);

  console.log(`${s.token_metadata.side}:`);
  console.log(`  Trend: ${trends.trend}`);
  console.log(`  Change: ${summary.price_summary.change_pct}%`);
}
```
