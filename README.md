# DOME Skills

A TypeScript-based toolkit for analyzing Polymarket prediction market data through the DOME API. Enables quantitative researchers to discover markets, retrieve historical data, and design rigorous backtesting workflows.

## Prerequisites

Before using this toolkit, you need:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **DOME API Key** - Contact the DOME team or check your DOME dashboard to obtain an API key

## Installation

```bash
# Clone or navigate to the repository
cd DOME_skills

# Install dependencies
npm install

# Build TypeScript files to JavaScript (required before using skills)
npm run build

# Set your DOME API key
export DOME_API_KEY="your_api_key_here"

# Or create a .env file in test/unit/
echo "DOME_API_KEY=your_api_key_here" > test/unit/.env
```

> **Note:** You must run `npm run build` after installation to compile TypeScript files. The skills import `.js` files, which are generated from the `.ts` source files during the build process.

## Quick Start

```bash
# Run all tests to verify setup
npm test

# Run specific test suites
npm run test:market-discovery
npm run test:historical-trades
npm run test:candlestick-analysis
npm run test:backtest-planner
```

## Skills Overview

### Market Discovery (`dome-data` plugin)

**Purpose:** Find and filter prediction markets for analysis and backtesting.

**Key Capabilities:**
- Search markets by keywords, tags (crypto, politics, sports), and volume
- Filter by market status (active, closed, resolved)
- Identify closed markets suitable for backtesting
- Retrieve market details by condition ID or slug

**Example Use Cases:**
- "Find high-volume crypto markets for momentum strategy backtesting"
- "Get all closed Bitcoin prediction markets from 2024"

**Trigger Phrases:**
- "Find crypto markets with high volume"
- "Get market details for condition 0x1234..."
- "Filter markets suitable for backtesting"

---

### Historical Trades (`dome-data` plugin)

**Purpose:** Fetch and analyze historical trade execution data.

**Key Capabilities:**
- Retrieve trade history for specific markets
- Filter trades by user wallet address
- Aggregate trades by time buckets (hourly, daily)
- Calculate buy/sell pressure and trading statistics

**Example Use Cases:**
- "Analyze trading activity around market events"
- "Calculate buy/sell ratio for the past week"
- "Track a specific trader's activity on a market"

**Trigger Phrases:**
- "Get trade history for Bitcoin market"
- "Show hourly trading volume"
- "Calculate buy/sell ratio"

---

### Candlestick Analysis (`dome-data` plugin)

**Purpose:** Retrieve and analyze OHLCV price data with technical indicators.

**Key Capabilities:**
- Fetch candlestick data at 1m, 1h, and 1d intervals
- Calculate SMA, EMA, and volatility
- Detect price trends and support/resistance levels
- Compare Yes vs No token price action

**Example Use Cases:**
- "Calculate 20-day moving average for this market"
- "Detect price trends and support levels"
- "Compare Yes and No price divergence"

**Trigger Phrases:**
- "Get candlestick data for market 0x1234..."
- "Calculate SMA for this market"
- "Detect price trends"

**Data Limitations:**

| Interval | Max Range | Best For |
|----------|-----------|----------|
| 1m | 1 week | High-frequency analysis |
| 1h | 1 month | Technical analysis |
| 1d | 1 year | Long-term trends |

---

### Backtest Planner (`dome-backtesting` plugin)

**Purpose:** Design and validate quantitative research plans for backtesting.

**Key Capabilities:**
- Validate backtest parameters against data constraints
- Calculate data requirements and API call estimates
- Check data coverage for specified time periods
- Generate structured backtest plans with research questions and hypotheses

**Supported Strategy Types:**

| Type | Description | Risk Level | Time Horizon |
|------|-------------|------------|--------------|
| `event_driven` | Trade around specific events | High | Minutes/Hours |
| `price_driven` | Technical pattern trading | Medium | Hours/Days |
| `momentum` | Trend-following | Medium | Days/Weeks |
| `mean_reversion` | Contrarian strategies | High | Days |

**Example Use Cases:**
- "Plan a momentum strategy backtest for Q1 2024"
- "Validate my backtest parameters"
- "Estimate data requirements for event-driven strategy"

**Trigger Phrases:**
- "Plan a backtest for momentum strategy"
- "Validate these backtest parameters"
- "Calculate data requirements for this backtest"

---

## Project Structure

```
DOME_skills/
├── packages/plugins/
│   ├── dome-data/              # Data access plugin
│   │   ├── README.md
│   │   └── skills/
│   │       ├── market-discovery/     # Market discovery skill
│   │       ├── historical-trades/    # Trade history skill
│   │       └── candlestick-analysis/ # Price data skill
│   └── dome-backtesting/       # Backtesting plugin
│       ├── README.md
│       └── skills/
│           └── backtest-planner/     # Backtest planning skill
├── docs/
│   ├── overview.md             # Project overview
│   ├── architecture/           # Architecture documentation
│   ├── plugins/                # Plugin documentation
│   └── skills/                 # Individual skill documentation
└── test/
    ├── unit/                   # Unit tests (Vitest)
    └── example/                # Usage examples by scenario
```

## Usage Example

```typescript
import { fetchMarkets, filterBacktestCandidates } from './packages/plugins/dome-data/skills/market-discovery/scripts/marketDiscovery.js';
import { fetchCandlesticks, calculateSMA } from './packages/plugins/dome-data/skills/candlestick-analysis/scripts/candlestickAnalysis.js';
import { validateBacktestParams, generateBacktestPlan } from './packages/plugins/dome-backtesting/skills/backtest-planner/scripts/backtestPlanner.js';

// Step 1: Discover markets
const markets = await fetchMarkets(apiKey, {
  tags: ['crypto', 'bitcoin'],
  min_volume: 100000,
  status: 'closed'
});

// Step 2: Filter for backtesting
const candidates = filterBacktestCandidates(markets, {
  minVolume: 50000,
  minDurationHours: 720 // 30 days
});

// Step 3: Fetch price data
const conditionId = candidates[0].condition_id;
const series = await fetchCandlesticks(
  apiKey,
  conditionId,
  1704067200,  // 2024-01-01
  1706745600,  // 2024-03-01
  3600         // 1 hour interval
);

// Step 4: Calculate indicators
const closes = series[0].candlesticks.map(c => c.close_price);
const sma20 = calculateSMA(closes, 20);

// Step 5: Plan backtest
const params = {
  market_condition_id: conditionId,
  start_time: '2024-01-01',
  end_time: '2024-03-01',
  strategy_type: 'momentum',
  interval: '1h',
  initial_capital: 10000,
  position_size: 0.1
};

const validation = validateBacktestParams(params);
if (validation.is_valid) {
  const plan = generateBacktestPlan(params);
  console.log('Research Question:', plan.research_question);
  console.log('Hypothesis:', plan.hypothesis);
  console.log('Assumptions:', plan.assumptions);
}
```

## Testing

Tests are written with Vitest and organized by plugin:

```bash
# Run all tests (unit tests only, no API calls required for most)
npm test

# Run with live API integration tests
export DOME_API_KEY="your_key"
npm test

# Run specific test file
npx vitest run test/unit/dome-data/marketDiscovery.test.ts
```

## Documentation

- [Overview](docs/overview.md) - Project overview and capabilities
- [Architecture](docs/architecture/README.md) - System architecture and design patterns
- [dome-data Plugin](docs/plugins/dome-data.md) - Data access plugin documentation
- [dome-backtesting Plugin](docs/plugins/dome-backtesting.md) - Backtesting plugin documentation

## Getting Help

If you encounter issues:

1. Check that your API key is set: `echo $DOME_API_KEY`
2. Verify Node.js version: `node --version` (should be 18+)
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check the [example scenarios](test/example/) for usage patterns

## License

MIT
