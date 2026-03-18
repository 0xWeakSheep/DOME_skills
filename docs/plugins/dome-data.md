# DOME Data Plugin Documentation

The `dome-data` plugin provides foundational data access capabilities for Polymarket prediction markets.

## Purpose

Enable researchers to discover markets and retrieve historical data for quantitative analysis.

## Skills

### market-discovery

**Purpose:** Find and filter prediction markets

**Key Functions:**
- `fetchMarkets()` - Retrieve markets with filters
- `fetchAllMarkets()` - Paginate through all matching markets
- `searchMarkets()` - Keyword-based search
- `getMarketByConditionId()` - Get specific market by ID
- `getMarketBySlug()` - Get market by slug
- `filterBacktestCandidates()` - Filter markets for backtesting

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | string[] | Filter by tags (crypto, politics, sports) |
| `min_volume` | number | Minimum volume threshold |
| `status` | string | Market status (active, closed, resolved) |
| `search` | string | Keyword search (2+ characters) |
| `limit` | number | Results per page (1-100) |

**Example:**
```typescript
const markets = await fetchMarkets(apiKey, {
  tags: ['crypto', 'bitcoin'],
  min_volume: 100000,
  status: 'closed',
  limit: 50
});
```

### historical-trades

**Purpose:** Retrieve and analyze historical trade data

**Key Functions:**
- `fetchTrades()` - Get trades with filters
- `fetchAllTrades()` - Paginate through all trades
- `calculateTradeStats()` - Compute trading statistics
- `aggregateTradesByTime()` - Bucket trades by time

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `market_slug` | string | Market slug identifier |
| `token_id` | string | Token ID |
| `condition_id` | string | Condition ID |
| `user` | string | Filter by wallet address |
| `start_time` | number | Unix timestamp (seconds) |
| `end_time` | number | Unix timestamp (seconds) |
| `limit` | number | Results per request (1-1000) |

**Constraints:** Only one of `market_slug`, `token_id`, `condition_id` can be used.

**Example:**
```typescript
const trades = await fetchTrades(apiKey, {
  market_slug: "will-bitcoin-hit-100k-in-2024",
  start_time: 1704067200,
  end_time: 1706745600,
  limit: 1000
});
```

### candlestick-analysis

**Purpose:** Retrieve and analyze OHLCV price data

**Key Functions:**
- `fetchCandlesticks()` - Get candlestick data
- `calculateSMA()` - Simple moving average
- `calculateEMA()` - Exponential moving average
- `calculateVolatility()` - Price volatility
- `detectPriceTrends()` - Trend detection

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `condition_id` | string | Market condition ID |
| `start_time` | number | Unix timestamp (seconds) |
| `end_time` | number | Unix timestamp (seconds) |
| `interval` | number | 1 (1m), 60 (1h), 1440 (1d) |

**Time Range Limits:**

| Interval | Max Range |
|----------|-----------|
| 1m | 1 week |
| 1h | 1 month |
| 1d | 1 year |

**Example:**
```typescript
const series = await fetchCandlesticks(
  apiKey,
  "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb",
  1704067200,
  1706745600,
  60 // 1 hour
);

const closes = series[0].candlesticks.map(c => c.close_price);
const sma20 = calculateSMA(closes, 20);
```

### orderbook-replay

**Purpose:** Analyze historical orderbook snapshots

**Key Functions:**
- `fetchOrderbookSnapshots()` - Get orderbook history
- `analyzeBidAskSpread()` - Spread analysis
- `trackLiquidityDepth()` - Liquidity evolution

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token_id` | string | Token ID |
| `timestamp` | number | Unix timestamp |

## API Endpoints

| Skill | Endpoint | Method |
|-------|----------|--------|
| market-discovery | `/polymarket/markets` | GET |
| historical-trades | `/polymarket/orders` | GET |
| candlestick-analysis | `/polymarket/candlesticks/{condition_id}` | GET |
| orderbook-replay | `/polymarket/orderbook` | GET |

## Error Handling

All skills in this plugin throw standardized errors:

```typescript
try {
  const markets = await fetchMarkets(apiKey, params);
} catch (error) {
  if (error instanceof DomeAPIValidationError) {
    // Handle validation errors (400)
  } else if (error instanceof DomeAPIRateLimitError) {
    // Handle rate limit (429)
  } else if (error instanceof DomeAPIError) {
    // Handle other API errors
  }
}
```

## Data Types

### Market

```typescript
interface Market {
  id: string;
  condition_id: string;
  slug: string;
  title: string;
  description: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  end_date: string;
  start_date: string;
  volume: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  outcomes: string[];
  outcomePrices: string;
}
```

### Trade

```typescript
interface Trade {
  id: string;
  transaction_hash: string;
  timestamp: string;
  user: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  market_slug: string;
  condition_id: string;
  outcome_index: number;
}
```

### Candlestick

```typescript
interface Candlestick {
  timestamp: number;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
}
```

## Best Practices

1. **Use pagination** for large datasets
2. **Validate time ranges** before fetching
3. **Cache results** when appropriate
4. **Handle rate limits** with exponential backoff
5. **Filter server-side** when possible to reduce data transfer
