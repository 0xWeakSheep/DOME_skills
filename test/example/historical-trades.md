# Historical Trades Skill - Example Scenarios

This document provides example scenarios for the historical-trades skill, including trigger phrases, input conditions, and expected outputs.

## Scenario 1: Analyzing Market Trading Activity

### Context
Researcher wants to understand trading patterns for a specific prediction market.

### Trigger Phrases
- "Get trade history for Bitcoin market"
- "Show me all trades for condition 0x1234..."
- "Fetch historical trades for will-ethereum-merge"
- "Pull trading data for token ID 56789"

### Input Conditions
```typescript
{
  market_slug: "will-bitcoin-hit-100k-in-2024",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  limit: 1000
}
```

### Expected Output
Trade history with:
- Buy/Sell transactions
- Prices and volumes
- Timestamps
- Trader wallet addresses
- Transaction hashes

### Anti-Patterns (Should NOT trigger this skill)
- "Show me current orderbook" (orderbook-replay skill)
- "Analyze my wallet trades" (wallet-analysis skill)
- "Calculate market sentiment" (research skill)

---

## Scenario 2: Tracking User Trading Activity

### Context
Analyze a specific trader's activity on a market.

### Trigger Phrases
- "Show trades by wallet 0x7c3db7..."
- "Get trading history for user 0xabc..."
- "What trades has this wallet made?"
- "Analyze trader activity on Bitcoin market"

### Input Conditions
```typescript
{
  market_slug: "will-bitcoin-hit-100k-in-2024",
  user: "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b",
  limit: 500
}
```

### Expected Output
Filtered trades for specific user:
- All buy/sell orders
- Position building pattern
- Average entry prices
- Trade timing analysis

---

## Scenario 3: Hourly Volume Analysis

### Context
Understand intraday trading patterns for a market.

### Trigger Phrases
- "Show hourly trading volume"
- "Aggregate trades by hour"
- "Get trading activity breakdown by time"
- "Analyze trading patterns throughout the day"

### Input Conditions
```typescript
{
  condition_id: "0x4567b275e6b667a6217f5cb4f06a797d3a1eaf1d0281fb5bc8c75e2046ae7e57",
  start_time: 1704153600, // 24 hours ago
  end_time: 1704240000,   // now
  interval_seconds: 3600  // 1 hour buckets
}
```

### Expected Output
Time-bucketed trade data:
- Hourly trade counts
- Volume per bucket
- Buy/Sell ratio per hour
- Price ranges per bucket

---

## Scenario 4: Buy/Sell Pressure Analysis

### Context
Determine market sentiment based on trading activity.

### Trigger Phrases
- "Calculate buy/sell ratio"
- "Show trading pressure analysis"
- "Is there more buying or selling?"
- "Analyze market sentiment from trades"

### Input Conditions
```typescript
{
  token_id: "58519484510520807142687824915233722607092670035910114837910294451210534222702",
  limit: 1000
}
```

### Expected Output
Trading statistics:
- Total buy vs sell volume
- Buy/Sell ratio
- Average buy price vs sell price
- Trade count breakdown
- Sentiment indicator (bullish/bearish)

---

## Data Limitations Reference

| Parameter | Limit | Notes |
|-----------|-------|-------|
| limit | 1-1000 per request | Default: 100 |
| Filter exclusivity | Only one of: market_slug, token_id, condition_id | Required constraint |
| Time range | Unix timestamps | Seconds since epoch |
| Pagination | cursor-based | Use pagination_key |

## Common Error Cases

1. **Multiple filters**: Using market_slug AND token_id → ValidationError
2. **No filter**: Fetching without any filter → ValidationError
3. **Invalid timestamps**: Non-numeric time values → API 400 error
4. **Missing required filter**: No market_slug/token_id/condition_id → ValidationError

## Example Workflows

### Workflow: Complete Market Analysis

```typescript
// Step 1: Discover market
const market = await getMarketBySlug(apiKey, "will-bitcoin-hit-100k");

// Step 2: Fetch all trades
const trades = await fetchAllTrades(apiKey, {
  condition_id: market.condition_id,
  maxTrades: 5000
});

// Step 3: Calculate statistics
const stats = calculateTradeStats(trades);
console.log(`Buy/Sell Ratio: ${stats.buy_sell_ratio}`);
console.log(`Total Volume: $${stats.total_volume}`);

// Step 4: Time aggregation
const hourly = aggregateTradesByTime(trades, 3600);
// Analyze hourly patterns
```
