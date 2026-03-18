# DOME Data Plugin

The `dome-data` plugin provides skills for accessing and analyzing historical data from Polymarket prediction markets via the DOME API.

## Purpose

This plugin enables researchers and traders to:

- Discover and filter prediction markets for analysis
- Fetch historical trade data for market microstructure research
- Retrieve candlestick/OHLCV data for technical analysis
- Replay orderbook snapshots for liquidity analysis

## Skills

### market-discovery

Market discovery, filtering, and backtest candidate selection.

**Key capabilities:**
- Search markets by keywords, tags, or criteria
- Filter by volume, status, date ranges
- Identify closed markets suitable for backtesting
- Retrieve market details by condition ID, slug, or token ID

**Location:** `skills/market-discovery/`

### historical-trades

Fetch and analyze historical trade execution data.

**Key capabilities:**
- Retrieve trade history for specific markets
- Filter trades by user wallet
- Aggregate trades by time buckets
- Calculate buy/sell pressure and trading statistics

**Location:** `skills/historical-trades/`

### candlestick-analysis

Retrieve and analyze price series and candlestick data.

**Key capabilities:**
- Fetch OHLCV data at multiple intervals (1m, 1h, 1d)
- Calculate technical indicators (SMA, EMA, volatility)
- Detect price trends and support/resistance levels
- Compare Yes vs No token price action

**Location:** `skills/candlestick-analysis/`

### orderbook-replay

Orderbook snapshot analysis for market microstructure research.

**Key capabilities:**
- Fetch historical orderbook snapshots
- Analyze bid-ask spreads over time
- Study liquidity depth evolution
- Identify large order placements

**Location:** `skills/orderbook-replay/`

## API Dependencies

This plugin depends on the following DOME API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /polymarket/markets` | Market discovery and filtering |
| `GET /polymarket/orders` | Historical trade data |
| `GET /polymarket/candlesticks/{condition_id}` | Price series data |
| `GET /polymarket/orderbook` | Orderbook snapshots |

## Data Limitations

### Time Range Limits

| Interval | Max Range | Best For |
|----------|-----------|----------|
| 1 minute | 1 week | High-frequency analysis |
| 1 hour | 1 month | Technical analysis |
| 1 day | 1 year | Long-term trends |

### Rate Limits

- Standard tier: 100 requests/minute
- Pagination recommended for large datasets
- Cursor-based pagination using `pagination_key`

## Directory Structure

```
dome-data/
├── README.md
└── skills/
    ├── market-discovery/
    │   ├── SKILL.md
    │   ├── references/
    │   └── scripts/
    │       └── marketDiscovery.ts
    ├── historical-trades/
    │   ├── SKILL.md
    │   ├── references/
    │   └── scripts/
    │       └── historicalTrades.ts
    ├── candlestick-analysis/
    │   ├── SKILL.md
    │   ├── references/
    │   └── scripts/
    │       └── candlestickAnalysis.ts
    └── orderbook-replay/
        ├── SKILL.md
        ├── references/
        └── scripts/
            └── orderbookReplay.ts
```

## Usage Example

```typescript
import { fetchMarkets, filterBacktestCandidates } from './skills/market-discovery/scripts/marketDiscovery.js';
import { fetchCandlesticks, calculateSMA } from './skills/candlestick-analysis/scripts/candlestickAnalysis.js';

// Discover markets
const markets = await fetchMarkets(apiKey, {
  tags: ['crypto', 'bitcoin'],
  min_volume: 100000,
  status: 'closed'
});

// Filter for backtesting
const candidates = filterBacktestCandidates(markets, {
  minVolume: 50000,
  minDurationHours: 720
});

// Fetch price data
const series = await fetchCandlesticks(apiKey, conditionId, startTime, endTime, 3600);
const sma20 = calculateSMA(series[0].candlesticks.map(c => c.close_price), 20);
```

## Error Handling

All functions throw standardized errors:

- `DomeAPIError`: API request failures
- `DomeAPIValidationError`: Invalid parameters
- `DomeAPIRateLimitError`: Rate limit exceeded
- `ValidationError`: Client-side validation failures
