# Market Discovery Skill

Market discovery, filtering, and backtest candidate selection for Polymarket prediction markets.

## Purpose

Enable researchers to find and filter prediction markets based on criteria suitable for quantitative analysis and backtesting.

## Trigger Phrases

- "Find crypto markets with high volume"
- "Show me Bitcoin prediction markets"
- "Discover markets with volume over $100k"
- "Filter markets by crypto tags"
- "Find closed markets for backtesting"
- "Get market details for condition 0x1234..."

## Anti-Patterns (Should NOT Trigger)

- "Execute a trade on Bitcoin market" (trading action, not discovery)
- "Show me my portfolio" (wallet analysis)
- "Calculate my PnL" (pnl-analysis skill)

## Key Functions

### fetchMarkets()

Retrieve markets with optional filters.

```typescript
async function fetchMarkets(
  apiKey: string,
  params: FetchMarketsParams,
  paginationKey?: string
): Promise<MarketsResponse>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | string[] | Filter by tags (crypto, bitcoin, politics, sports) |
| `min_volume` | number | Minimum volume in USD |
| `status` | string | Market status: active, closed, resolved |
| `limit` | number | Results per page (1-100, default: 10) |
| `search` | string | Keyword search (min 2 chars, cannot combine with other filters) |

**Returns:** `MarketsResponse` with markets array and pagination info.

### fetchAllMarkets()

Paginate through all matching markets.

```typescript
async function fetchAllMarkets(
  apiKey: string,
  params: FetchMarketsParams,
  maxPages?: number
): Promise<Market[]>
```

**Use when:** You need all matching markets, not just the first page.

### searchMarkets()

Keyword-based market search.

```typescript
async function searchMarkets(
  apiKey: string,
  query: string,
  limit?: number
): Promise<Market[]>
```

**Constraints:**
- Minimum 2 characters
- Cannot combine with other filters
- Returns relevance-ranked results

### getMarketByConditionId()

Get specific market by condition ID.

```typescript
async function getMarketByConditionId(
  apiKey: string,
  conditionId: string
): Promise<Market | null>
```

### getMarketBySlug()

Get market by slug identifier.

```typescript
async function getMarketBySlug(
  apiKey: string,
  slug: string
): Promise<Market | null>
```

### filterBacktestCandidates()

Filter markets suitable for backtesting.

```typescript
function filterBacktestCandidates(
  markets: Market[],
  criteria: BacktestCriteria
): ParsedMarket[]
```

**Criteria:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `minVolume` | number | Minimum volume threshold |
| `minDurationHours` | number | Minimum market duration |
| `requireClosed` | boolean | Only closed markets |
| `startTime` | Date | Markets created after |
| `endTime` | Date | Markets created before |

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

### ParsedMarket

```typescript
interface ParsedMarket {
  id: string;
  conditionId: string;
  slug: string;
  title: string;
  description: string;
  isActive: boolean;
  isClosed: boolean;
  isArchived: boolean;
  endDate: Date;
  startDate: Date;
  volumeUsd: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  outcomes: string[];
  outcomePrices: number[];
  durationHours: number;
}
```

## Examples

### Find High-Volume Crypto Markets

```typescript
const markets = await fetchMarkets(apiKey, {
  tags: ['crypto', 'bitcoin'],
  min_volume: 100000,
  status: 'closed',
  limit: 50
});

console.log(`Found ${markets.data.length} markets`);
markets.data.forEach(m => {
  console.log(`${m.title}: $${m.volume} volume`);
});
```

### Search by Keywords

```typescript
const results = await searchMarkets(apiKey, 'presidential election', 20);
```

### Identify Backtest Candidates

```typescript
const markets = await fetchAllMarkets(apiKey, {
  status: 'closed',
  min_volume: 50000
});

const candidates = filterBacktestCandidates(markets, {
  minVolume: 50000,
  minDurationHours: 720, // 30 days
  requireClosed: true
});

console.log(`${candidates.length} markets suitable for backtesting`);
```

### Get Market by ID

```typescript
const market = await getMarketByConditionId(
  apiKey,
  '0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb'
);

if (market) {
  console.log(`Title: ${market.title}`);
  console.log(`Volume: $${market.volume}`);
}
```

## Error Handling

```typescript
try {
  const markets = await fetchMarkets(apiKey, params);
} catch (error) {
  if (error instanceof DomeAPIValidationError) {
    // Invalid parameters (400)
  } else if (error instanceof DomeAPIRateLimitError) {
    // Rate limited (429)
  } else if (error instanceof DomeAPIError) {
    // Other API errors
  }
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Search too short" | Query < 2 characters | Use longer search term |
| "Cannot combine search with filters" | Using search + other params | Use only search or only filters |
| "Invalid status" | Status not in allowed list | Use: active, closed, resolved |
| "Rate limit exceeded" | Too many requests | Implement backoff, reduce request rate |

## Data Limitations

| Parameter | Limit | Notes |
|-----------|-------|-------|
| `limit` | 1-100 per request | Default: 10 |
| `token_id` array | Max 100 items | For batch filtering |
| `search` | Min 2 characters | Cannot combine with other filters |
| Pagination | Cursor-based | Use `pagination_key` from response |

## Best Practices

1. **Use server-side filtering** when possible to reduce data transfer
2. **Paginate large result sets** using `fetchAllMarkets()`
3. **Cache market metadata** that doesn't change frequently
4. **Validate condition IDs** before making requests
5. **Handle rate limits** with exponential backoff
