# Historical Trades Skill

Fetch and analyze historical trade execution data from Polymarket.

## Purpose

Enable researchers to analyze trading patterns, market microstructure, and participant behavior through historical trade data.

## Trigger Phrases

- "Get trade history for Bitcoin market"
- "Show me all trades for condition 0x1234..."
- "Fetch historical trades for will-ethereum-merge"
- "Show trades by wallet 0x7c3db7..."
- "Show hourly trading volume"
- "Calculate buy/sell ratio"

## Anti-Patterns (Should NOT Trigger)

- "Show me current orderbook" (orderbook-replay skill)
- "Analyze my wallet trades" (wallet-analysis skill)
- "Calculate market sentiment" (research skill)

## Key Functions

### fetchTrades()

Retrieve trades with filters.

```typescript
async function fetchTrades(
  apiKey: string,
  params: FetchTradesParams,
  paginationKey?: string
): Promise<TradesResponse>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `market_slug` | string | Market slug identifier |
| `token_id` | string | Token ID |
| `condition_id` | string | Condition ID |
| `user` | string | Filter by wallet address |
| `start_time` | number | Unix timestamp (seconds) |
| `end_time` | number | Unix timestamp (seconds) |
| `limit` | number | Results per request (1-1000, default: 100) |

**Important:** Only ONE of `market_slug`, `token_id`, `condition_id` can be used.

### fetchAllTrades()

Paginate through all matching trades.

```typescript
async function fetchAllTrades(
  apiKey: string,
  params: FetchTradesParams,
  maxTrades?: number
): Promise<Trade[]>
```

### calculateTradeStats()

Calculate trading statistics.

```typescript
function calculateTradeStats(trades: ParsedTrade[]): TradeStats
```

**Returns:**

| Field | Description |
|-------|-------------|
| `total_volume` | Total trading volume |
| `buy_volume` | Volume from buy orders |
| `sell_volume` | Volume from sell orders |
| `buy_sell_ratio` | Ratio of buy to sell volume |
| `avg_price` | Volume-weighted average price |
| `price_range` | Min/max prices |
| `total_trades` | Total trade count |
| `unique_traders` | Number of unique wallets |

### aggregateTradesByTime()

Bucket trades by time intervals.

```typescript
function aggregateTradesByTime(
  trades: ParsedTrade[],
  intervalSeconds: number
): TimeBucket[]
```

## Data Types

### Trade

```typescript
interface Trade {
  id: string;
  transaction_hash: string;
  timestamp: string;  // ISO 8601
  user: string;       // Wallet address
  side: 'BUY' | 'SELL';
  size: string;       // Decimal string
  price: string;      // Decimal string
  market_slug: string;
  condition_id: string;
  outcome_index: number;
}
```

### ParsedTrade

```typescript
interface ParsedTrade {
  id: string;
  transactionHash: string;
  timestamp: Date;
  user: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  marketSlug: string;
  conditionId: string;
  outcomeIndex: number;
}
```

### TradeStats

```typescript
interface TradeStats {
  total_volume: number;
  buy_volume: number;
  sell_volume: number;
  buy_sell_ratio: number;
  avg_price: number;
  price_range: { min: number; max: number };
  total_trades: number;
  unique_traders: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}
```

### TimeBucket

```typescript
interface TimeBucket {
  startTime: Date;
  endTime: Date;
  trades: ParsedTrade[];
  volume: number;
  buy_volume: number;
  sell_volume: number;
  avg_price: number;
  high_price: number;
  low_price: number;
  trade_count: number;
}
```

## Examples

### Get Market Trading Activity

```typescript
const trades = await fetchTrades(apiKey, {
  market_slug: 'will-bitcoin-hit-100k-in-2024',
  start_time: 1704067200,  // 2024-01-01
  end_time: 1706745600,    // 2024-03-01
  limit: 1000
});

console.log(`Retrieved ${trades.data.length} trades`);
```

### Track User Trading Activity

```typescript
const userTrades = await fetchTrades(apiKey, {
  market_slug: 'will-bitcoin-hit-100k-in-2024',
  user: '0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b',
  limit: 500
});

const parsed = userTrades.data.map(parseTradeData);
console.log(`User made ${parsed.length} trades`);
```

### Calculate Trading Statistics

```typescript
const allTrades = await fetchAllTrades(apiKey, {
  condition_id: '0x4567b275e6b667a6217f5cb4f06a797d3a1eaf1d0281fb5bc8c75e2046ae7e57'
});

const parsed = allTrades.map(parseTradeData);
const stats = calculateTradeStats(parsed);

console.log(`Buy/Sell Ratio: ${stats.buy_sell_ratio.toFixed(2)}`);
console.log(`Sentiment: ${stats.sentiment}`);
console.log(`Unique Traders: ${stats.unique_traders}`);
```

### Hourly Volume Analysis

```typescript
const trades = await fetchAllTrades(apiKey, {
  condition_id: '0x4567...',
  start_time: 1704153600,
  end_time: 1704240000
});

const parsed = trades.map(parseTradeData);
const hourly = aggregateTradesByTime(parsed, 3600); // 1 hour buckets

hourly.forEach(bucket => {
  console.log(`${bucket.startTime.toISOString()}: ${bucket.trade_count} trades, $${bucket.volume} volume`);
});
```

### Buy/Sell Pressure Analysis

```typescript
const trades = await fetchAllTrades(apiKey, {
  token_id: '58519484510520807142687824915233722607092670035910114837910294451210534222702',
  limit: 1000
});

const parsed = trades.map(parseTradeData);
const stats = calculateTradeStats(parsed);

console.log(`Buy Volume: $${stats.buy_volume}`);
console.log(`Sell Volume: $${stats.sell_volume}`);
console.log(`Ratio: ${stats.buy_sell_ratio.toFixed(2)}`);
console.log(`Sentiment: ${stats.sentiment}`);
```

## Error Handling

```typescript
try {
  const trades = await fetchTrades(apiKey, params);
} catch (error) {
  if (error instanceof DomeAPIValidationError) {
    // Multiple filters or invalid parameters
  } else if (error instanceof DomeAPIError) {
    // API request failed
  }
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Multiple filters specified" | Using >1 of market_slug, token_id, condition_id | Use only one filter |
| "No filter specified" | Missing required filter | Add market_slug, token_id, or condition_id |
| "Invalid timestamp" | Non-numeric time values | Use Unix timestamps (seconds) |
| "Limit exceeds maximum" | limit > 1000 | Use max 1000 |

## Data Limitations

| Parameter | Limit | Notes |
|-----------|-------|-------|
| `limit` | 1-1000 per request | Default: 100 |
| Filter exclusivity | One of: market_slug, token_id, condition_id | Required |
| Time range | Unix timestamps | Seconds since epoch |
| Pagination | Cursor-based | Use `pagination_key` |

## Best Practices

1. **Use appropriate filter** - Choose the most specific filter for your use case
2. **Paginate large datasets** - Use `fetchAllTrades()` for complete history
3. **Cache results** - Trade data is immutable, safe to cache
4. **Handle timezones** - Timestamps are UTC, convert as needed
5. **Validate wallet addresses** - Ensure 0x prefix and correct length
