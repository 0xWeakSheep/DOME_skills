# Candlestick Analysis Skill

Retrieve and analyze OHLCV price data and technical indicators for Polymarket prediction markets.

## Purpose

Enable quantitative researchers to perform technical analysis on prediction market price action using candlestick data and calculated indicators.

## Trigger Phrases

- "Get candlestick data for market 0x1234..."
- "Fetch price history with 1-hour intervals"
- "Show me OHLCV data for Bitcoin market"
- "Calculate SMA for this market"
- "Show me 20-day moving average"
- "Compute volatility indicators"
- "Detect price trends for this market"
- "Find support and resistance levels"
- "Compare Yes and No price action"

## Anti-Patterns (Should NOT Trigger)

- "Show me individual trades" (historical-trades skill)
- "Get current market price" (real-time data, not historical)
- "Analyze orderbook depth" (orderbook-replay skill)

## Key Functions

### fetchCandlesticks()

Retrieve OHLCV candlestick data.

```typescript
async function fetchCandlesticks(
  apiKey: string,
  conditionId: string,
  startTime: number,
  endTime: number,
  interval: number
): Promise<CandlestickSeries[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conditionId` | string | Market condition ID |
| `startTime` | number | Unix timestamp (seconds) |
| `endTime` | number | Unix timestamp (seconds) |
| `interval` | number | 1 (1m), 60 (1h), 1440 (1d) |

**Returns:** Array of `CandlestickSeries` (one per outcome token).

### calculateSMA()

Calculate Simple Moving Average.

```typescript
function calculateSMA(prices: number[], period: number): (number | null)[]
```

**Returns:** Array of SMA values (null for first `period-1` values).

### calculateEMA()

Calculate Exponential Moving Average.

```typescript
function calculateEMA(prices: number[], period: number): (number | null)[]
```

### calculateVolatility()

Calculate price volatility (standard deviation).

```typescript
function calculateVolatility(prices: number[], period: number): (number | null)[]
```

### detectPriceTrends()

Detect price trends and support/resistance levels.

```typescript
function detectPriceTrends(
  candlesticks: Candlestick[],
  window?: number
): TrendResult
```

**Returns:**

| Field | Description |
|-------|-------------|
| `trend` | 'uptrend', 'downtrend', or 'sideways' |
| `strength` | Trend strength 0-1 |
| `support_levels` | Support price levels |
| `resistance_levels` | Resistance price levels |
| `price_range` | Min/max prices |

### formatCandlestickSummary()

Generate human-readable summary.

```typescript
function formatCandlestickSummary(series: CandlestickSeries): CandlestickSummary
```

## Data Types

### Candlestick

```typescript
interface Candlestick {
  end_period_ts: number;  // Unix timestamp (seconds)
  open_price: number;     // Opening price
  high_price: number;     // Highest price
  low_price: number;      // Lowest price
  close_price: number;    // Closing price
  volume: number;         // Trading volume
}
```

### TokenMetadata

```typescript
interface TokenMetadata {
  token_id: string;
  outcome: string;        // "Yes" or "No"
  side: 'Yes' | 'No';
}
```

### CandlestickSeries

```typescript
interface CandlestickSeries {
  token_metadata: TokenMetadata;
  candlesticks: Candlestick[];
}
```

### TrendResult

```typescript
interface TrendResult {
  trend: 'uptrend' | 'downtrend' | 'sideways';
  strength: number;       // 0-1
  support_levels: number[];
  resistance_levels: number[];
  price_range: { min: number; max: number };
}
```

### CandlestickSummary

```typescript
interface CandlestickSummary {
  token_id: string;
  side: 'Yes' | 'No';
  start_time: Date;
  end_time: Date;
  data_points: number;
  price_summary: {
    open: number;
    high: number;
    low: number;
    close: number;
    change_pct: number;
    volatility: number;
  };
  volume_summary: {
    total: number;
    avg_per_period: number;
    max: number;
  };
}
```

## Time Range Limits

| Interval | Code | Max Range | Best For |
|----------|------|-----------|----------|
| 1 minute | 1 | 1 week | High-frequency analysis |
| 1 hour | 60 | 1 month | Technical analysis |
| 1 day | 1440 | 1 year | Long-term trends |

## Examples

### Fetch OHLCV Data

```typescript
const series = await fetchCandlesticks(
  apiKey,
  '0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb',
  1704067200,  // 2024-01-01
  1706745600,  // 2024-02-01
  60           // 1 hour
);

series.forEach(s => {
  console.log(`${s.token_metadata.side}: ${s.candlesticks.length} candles`);
});
```

### Calculate Technical Indicators

```typescript
const series = await fetchCandlesticks(apiKey, conditionId, start, end, 60);
const yesSide = series.find(s => s.token_metadata.side === 'Yes');

if (yesSide) {
  const closes = yesSide.candlesticks.map(c => c.close_price);

  const sma20 = calculateSMA(closes, 20);
  const ema20 = calculateEMA(closes, 20);
  const volatility = calculateVolatility(closes, 20);

  console.log('Last SMA(20):', sma20[sma20.length - 1]);
  console.log('Last EMA(20):', ema20[ema20.length - 1]);
  console.log('Volatility:', volatility[volatility.length - 1]);
}
```

### Detect Trends

```typescript
const series = await fetchCandlesticks(apiKey, conditionId, start, end, 60);
const yesSide = series[0];

const trends = detectPriceTrends(yesSide.candlesticks, 5);

console.log(`Trend: ${trends.trend}`);
console.log(`Strength: ${(trends.strength * 100).toFixed(1)}%`);
console.log(`Support: ${trends.support_levels.join(', ')}`);
console.log(`Resistance: ${trends.resistance_levels.join(', ')}`);
```

### Compare Yes vs No Prices

```typescript
const series = await fetchCandlesticks(apiKey, conditionId, start, end, 1440);

const yesSeries = series.find(s => s.token_metadata.side === 'Yes');
const noSeries = series.find(s => s.token_metadata.side === 'No');

if (yesSeries && noSeries) {
  const yesCloses = yesSeries.candlesticks.map(c => c.close_price);
  const noCloses = noSeries.candlesticks.map(c => c.close_price);

  // Calculate correlation
  const correlation = calculateCorrelation(yesCloses, noCloses);
  console.log(`Yes/No Correlation: ${correlation.toFixed(3)}`);

  // Price should sum to ~1
  yesCloses.forEach((price, i) => {
    const sum = price + noCloses[i];
    console.log(`Day ${i}: Yes=${price.toFixed(3)}, No=${noCloses[i].toFixed(3)}, Sum=${sum.toFixed(3)}`);
  });
}
```

### Complete Technical Analysis

```typescript
async function analyzeMarket(conditionId: string) {
  const series = await fetchCandlesticks(
    apiKey, conditionId, startTime, endTime, 60
  );

  for (const s of series) {
    const closes = s.candlesticks.map(c => c.close_price);

    // Indicators
    const sma20 = calculateSMA(closes, 20);
    const ema20 = calculateEMA(closes, 20);
    const volatility = calculateVolatility(closes, 20);

    // Trends
    const trends = detectPriceTrends(s.candlesticks);

    // Summary
    const summary = formatCandlestickSummary(s);

    console.log(`${s.token_metadata.side}:`);
    console.log(`  Trend: ${trends.trend} (${(trends.strength * 100).toFixed(1)}%)`);
    console.log(`  Change: ${summary.price_summary.change_pct.toFixed(2)}%`);
    console.log(`  Volatility: ${summary.price_summary.volatility.toFixed(4)}`);
  }
}
```

## Error Handling

```typescript
try {
  const series = await fetchCandlesticks(apiKey, conditionId, start, end, 60);
} catch (error) {
  if (error instanceof ValidationError) {
    // Time range exceeds limit
    console.error('Validation:', error.message);
  } else if (error instanceof DataCoverageError) {
    // Missing data for time range
    console.error('Coverage:', error.message);
  } else if (error instanceof DomeAPIError) {
    // API error
    console.error('API:', error.message);
  }
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Time range exceeds limit" | Range too long for interval | Shorten range or use coarser interval |
| "Invalid interval" | Using unsupported interval | Use: 1, 60, or 1440 |
| "Start after end" | start_time > end_time | Swap timestamps |
| "No data returned" | Condition ID invalid or no data | Verify condition ID |

## Best Practices

1. **Choose appropriate interval** - Match interval to analysis timeframe
2. **Handle gaps** - Markets may have periods of no trading
3. **Validate price sums** - Yes + No prices should approximate $1
4. **Cache results** - Candlestick data is historical and immutable
5. **Consider liquidity** - Low volume periods may have stale prices
