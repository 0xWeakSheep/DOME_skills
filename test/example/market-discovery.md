# Market Discovery Skill - Example Scenarios

This document provides example scenarios for the market-discovery skill, including trigger phrases, input conditions, and expected outputs.

## Scenario 1: Finding High-Volume Crypto Markets

### Context
A researcher wants to identify prediction markets suitable for backtesting a crypto trading strategy.

### Trigger Phrases
- "Find crypto markets with high volume"
- "Show me Bitcoin prediction markets"
- "Discover markets with volume over $100k"
- "Filter markets by crypto tags"

### Input Conditions
```typescript
{
  tags: ["crypto", "bitcoin"],
  min_volume: 100000,
  status: "closed",
  limit: 50
}
```

### Expected Output
List of markets matching criteria with:
- Market title and description
- Volume statistics
- Date ranges
- Condition IDs for further analysis

### Anti-Patterns (Should NOT trigger this skill)
- "Execute a trade on Bitcoin market" (trading action, not discovery)
- "Show me my portfolio" (wallet analysis, not market discovery)
- "Calculate my PnL" (pnl-analysis skill)

---

## Scenario 2: Searching by Keywords

### Context
User is looking for markets related to a specific event or topic.

### Trigger Phrases
- "Search for election markets"
- "Find markets about Trump"
- "Look for sports betting markets"
- "Search: Ethereum price prediction"

### Input Conditions
```typescript
{
  search: "presidential election",
  limit: 20
}
```

### Expected Output
Search results with relevance ranking, including:
- Matching markets with relevance scores
- Highlighted keywords in descriptions
- Pagination for large result sets

---

## Scenario 3: Identifying Backtest Candidates

### Context
Quant researcher needs closed markets with sufficient history for strategy validation.

### Trigger Phrases
- "Find closed markets for backtesting"
- "Show me markets that have resolved"
- "Identify backtest candidates with 30+ days duration"
- "Filter markets suitable for historical analysis"

### Input Conditions
```typescript
{
  status: "closed",
  min_volume: 50000,
  start_time: 1609459200, // 2021-01-01
  end_time: 1704067200,   // 2024-01-01
  require_closed: true,
  min_duration_hours: 720 // 30 days
}
```

### Expected Output
Filtered list of markets meeting backtest criteria:
- Markets with complete lifecycle (open to close)
- Sufficient trading volume
- Adequate time duration
- No data gaps

---

## Scenario 4: Market by Condition ID

### Context
User has a specific market identifier and wants details.

### Trigger Phrases
- "Get market details for condition 0x1234..."
- "Show me market with token ID 56789"
- "Fetch market by slug will-bitcoin-hit-100k"

### Input Conditions
```typescript
{
  condition_id: "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb"
}
```

### Expected Output
Single market details including:
- Full market metadata
- Token IDs for both sides
- Historical volume data
- Resolution information

---

## Data Limitations Reference

| Parameter | Limit | Notes |
|-----------|-------|-------|
| limit | 1-100 per request | Default: 10 |
| token_id array | Max 100 items | For batch filtering |
| search | Min 2 characters | Cannot combine with other filters |
| time range | No hard limit | But pagination recommended |

## Common Error Cases

1. **Search with filters**: "Search for crypto markets with volume > 100k" → API error - search cannot combine with filters
2. **Too many token IDs**: Filter with >100 token IDs → Validation error
3. **Invalid condition ID**: Malformed hex string → API 400 error
