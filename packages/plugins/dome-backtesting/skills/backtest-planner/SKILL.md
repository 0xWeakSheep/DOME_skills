---
name: backtest-planner
description: |
  Plan and validate Polymarket backtesting workflows. Use this skill when:
  - Setting up a new backtest for prediction market strategies
  - Validating backtest parameters before execution
  - Estimating data requirements and API costs
  - Checking data coverage for historical analysis
  - Generating comprehensive backtest plans with research questions and risk assessments
  - Determining appropriate intervals and time ranges for data fetching
---

# Backtest Planner

Plan and validate backtesting workflows for Polymarket prediction market strategies.

## Quick Start

### Validate Backtest Parameters

```typescript
import { validateBacktestParams } from "./scripts/backtestPlanner.js";

const params = {
  market_condition_id: "0x1234...",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  strategy_type: "momentum",
  interval: "1h",
  initial_capital: 10000,
};

const result = validateBacktestParams(params);
if (!result.is_valid) {
  console.log("Validation errors:", result.errors);
}
```

### Calculate Data Requirements

```typescript
import { calculateDataRequirements } from "./scripts/backtestPlanner.js";

const requirements = calculateDataRequirements(params);
console.log(`Estimated API calls: ${requirements.estimated_api_calls}`);
console.log(`Data size: ${requirements.estimated_data_size_mb} MB`);
```

### Generate a Complete Backtest Plan

```typescript
import { generateBacktestPlan } from "./scripts/backtestPlanner.js";

const plan = generateBacktestPlan(params);
console.log(`Research question: ${plan.research_question}`);
console.log(`Hypothesis: ${plan.hypothesis}`);
console.log(`Assumptions:`, plan.assumptions);
console.log(`Risk considerations:`, plan.risk_considerations);
```

### Check Data Coverage

```typescript
import { checkDataCoverage } from "./scripts/backtestPlanner.js";

const coverage = await checkDataCoverage(
  apiKey,
  {
    market_condition_id: "0x1234...",
    start_time: new Date("2024-01-01"),
    end_time: new Date("2024-02-01"),
    interval: "1h"
  }
);

if (!coverage.has_coverage) {
  console.log("Recommendations:", coverage.recommendations);
}
```

### Estimate API Costs

```typescript
import { estimateApiCosts, calculateDataRequirements } from "./scripts/backtestPlanner.js";

const requirements = calculateDataRequirements(params);
const costs = estimateApiCosts(requirements);
console.log(`Estimated cost: $${costs.estimated_cost_usd}`);
console.log(`Optimization suggestions:`, costs.optimization_suggestions);
```

## Backtest Planning Workflow

### 1. Define Your Strategy

Choose a strategy type based on your research goals:

| Strategy Type | Best For | Data Requirements |
|--------------|----------|-------------------|
| `event_driven` | Trading around market events (creation, resolution) | Trade history, event timestamps |
| `price_driven` | Technical analysis and price patterns | Candlestick data (OHLCV) |
| `momentum` | Trend-following strategies | Candlestick data, volume |
| `mean_reversion` | Contrarian strategies at price extremes | Candlestick data, statistical indicators |

### 2. Validate Parameters

Always validate parameters before running a backtest:

```typescript
import { validateBacktestParams, ValidationError } from "./scripts/backtestPlanner.js";

const params = {
  market_condition_id: "0x...",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  strategy_type: "momentum",
  interval: "1h",
  initial_capital: 10000,
  position_size: 0.1,
};

const result = validateBacktestParams(params);
if (!result.is_valid) {
  for (const error of result.errors) {
    console.log(`Error: ${error}`);
  }
}
```

**Validation checks:**
- Required fields present (`market_condition_id`, `start_time`, `end_time`, `strategy_type`)
- Valid strategy type
- Time range valid (start < end, reasonable duration)
- Valid interval (1m, 1h, 1d)
- Positive numeric values for capital/position size

### 3. Check Data Coverage

```typescript
import { checkDataCoverage } from "./scripts/backtestPlanner.js";

const coverage = await checkDataCoverage(
  apiKey,
  {
    market_condition_id: "0x...",
    start_time: new Date("2024-01-01"),
    end_time: new Date("2024-06-01"),
    interval: "1h"
  }
);

if (coverage.has_coverage) {
  console.log("Data coverage is sufficient");
} else {
  console.log(`Coverage: ${coverage.coverage_percentage}%`);
  for (const rec of coverage.recommendations) {
    console.log(`Recommendation: ${rec}`);
  }
}
```

### 4. Generate Backtest Plan

```typescript
import { generateBacktestPlan } from "./scripts/backtestPlanner.js";

const plan = generateBacktestPlan(params);

// Review the complete plan
console.log("=".repeat(50));
console.log("BACKTEST PLAN");
console.log("=".repeat(50));
console.log(`\nResearch Question:\n  ${plan.research_question}`);
console.log(`\nHypothesis:\n  ${plan.hypothesis}`);
console.log(`\nAssumptions:`);
for (const assumption of plan.assumptions) {
  console.log(`  - ${assumption}`);
}
console.log(`\nConstraints:`);
for (const constraint of plan.constraints) {
  console.log(`  - ${constraint}`);
}
console.log(`\nRisk Considerations:`);
for (const risk of plan.risk_considerations) {
  console.log(`  - ${risk}`);
}
console.log(`\nSuccess Criteria:`);
for (const criterion of plan.success_criteria) {
  console.log(`  - ${criterion}`);
}
```

## Common Backtest Patterns

### Event-Driven Backtest

Trade around market events like creation and resolution:

```typescript
const params = {
  market_condition_id: "0xabc123...",
  start_time: "2024-01-01",
  end_time: "2024-01-31",
  strategy_type: "event_driven",
  interval: "1m",  // High frequency for event windows
  initial_capital: 5000,
};

// Event-driven strategies need trade history
const requirements = calculateDataRequirements(params);
console.assert(requirements.requires_trade_history === true);

const plan = generateBacktestPlan(params);
// Plan includes event window analysis, volatility profiles
```

### Price-Driven Backtest

Use technical indicators for trading signals:

```typescript
const params = {
  market_condition_id: "0xdef456...",
  start_time: "2024-01-01",
  end_time: "2024-06-30",
  strategy_type: "price_driven",
  interval: "1h",  // Hourly for technical analysis
  initial_capital: 10000,
};

// Check if interval is appropriate for time range
const coverage = await checkDataCoverage(
  apiKey,
  {
    market_condition_id: params.market_condition_id,
    start_time: new Date("2024-01-01"),
    end_time: new Date("2024-06-30"),
    interval: params.interval
  }
);

const plan = generateBacktestPlan(params);
// Plan includes signal distribution, indicator effectiveness
```

### Momentum Strategy

Follow price trends:

```typescript
const params = {
  market_condition_id: "0xghi789...",
  start_time: "2024-01-01",
  end_time: "2024-03-31",
  strategy_type: "momentum",
  interval: "1h",
  initial_capital: 10000,
};

const plan = generateBacktestPlan(params);
// Plan includes trend capture rate, momentum decay analysis
```

### Mean Reversion Strategy

Trade against price extremes:

```typescript
const params = {
  market_condition_id: "0xjkl012...",
  start_time: "2024-01-01",
  end_time: "2024-02-29",
  strategy_type: "mean_reversion",
  interval: "1h",
  initial_capital: 10000,
};

const plan = generateBacktestPlan(params);
// Plan includes reversion time analysis, threshold effectiveness
```

## Data Limitations

### Interval Range Limits

The Polymarket API has range limitations for different intervals:

| Interval | Maximum Range | Use Case |
|----------|--------------|----------|
| `1m` | 1 week | High-frequency event analysis |
| `1h` | 1 month | Technical analysis, intraday patterns |
| `1d` | 1 year | Long-term trend analysis |

### Working Around Limitations

**For ranges exceeding limits, split the backtest:**

```typescript
function splitTimeRange(startTime: Date, endTime: Date, maxDays: number): Array<[Date, Date]> {
  const chunks: Array<[Date, Date]> = [];
  let current = new Date(startTime);
  while (current < endTime) {
    const chunkEnd = new Date(Math.min(current.getTime() + maxDays * 24 * 60 * 60 * 1000, endTime.getTime()));
    chunks.push([new Date(current), chunkEnd]);
    current = chunkEnd;
  }
  return chunks;
}

// For 1h interval (max 30 days)
const start = new Date("2024-01-01");
const end = new Date("2024-06-30");
const chunks = splitTimeRange(start, end, 30);

for (const [chunkStart, chunkEnd] of chunks) {
  const coverage = await checkDataCoverage(
    apiKey,
    {
      market_condition_id: "0x...",
      start_time: chunkStart,
      end_time: chunkEnd,
      interval: "1h"
    }
  );
  console.log(`${chunkStart.toDateString()} to ${chunkEnd.toDateString()}: ${coverage.has_coverage}`);
}
```

**Choose appropriate interval for your time range:**

```typescript
function selectInterval(timeRangeDays: number): string {
  if (timeRangeDays <= 7) {
    return "1m";
  } else if (timeRangeDays <= 30) {
    return "1h";
  } else {
    return "1d";
  }
}

const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
const interval = selectInterval(days);
console.log(`Recommended interval for ${days} days: ${interval}`);
```

### Trade History Requirements

Trade history requires one of the following identifiers:
- `market_slug` (e.g., "will-bitcoin-hit-100k")
- `condition_id` (the market condition ID)
- `token_id` (specific outcome token ID)

```typescript
// Check if we can fetch trade history
const coverage = await checkDataCoverage(
  apiKey,
  {
    market_condition_id: "0x...",  // Must provide at least one identifier
    start_time: start,
    end_time: end,
  }
);

if (!coverage.has_coverage) {
  console.log("Cannot fetch trade history without valid identifier");
}
```

## Example Research Questions and Backtest Plans

### Example 1: Event-Driven Analysis

**Research Question:** How do prices behave in the 24 hours before and after market resolution?

```typescript
const params = {
  market_condition_id: "0xresolution-market...",
  start_time: "2024-01-01",
  end_time: "2024-01-31",
  strategy_type: "event_driven",
  interval: "1m",
  initial_capital: 5000,
};

const plan = generateBacktestPlan(params);
```

**Expected Plan Output:**
- Research Question: How do price movements around market events present trading opportunities?
- Hypothesis: Markets exhibit predictable volatility patterns around event times
- Key Assumptions: Event timestamps are accurate, market reactions follow patterns
- Risk Considerations: Event cancellation risk, binary outcome risk

### Example 2: Momentum Strategy

**Research Question:** Can we profit from price momentum in political prediction markets?

```typescript
const params = {
  market_condition_id: "0xpolitical-market...",
  start_time: "2024-01-01",
  end_time: "2024-03-31",
  strategy_type: "momentum",
  interval: "1h",
  initial_capital: 10000,
};

const plan = generateBacktestPlan(params);
```

**Expected Plan Output:**
- Research Question: Does price momentum persist long enough to capture profits?
- Hypothesis: Prices exhibit short-term momentum capturable through trend-following
- Key Assumptions: Momentum signals can be captured before decay
- Risk Considerations: Momentum crashes during reversals, late entry risk

### Example 3: Mean Reversion

**Research Question:** Do extreme price movements in sports markets tend to revert?

```typescript
const params = {
  market_condition_id: "0xsports-market...",
  start_time: "2024-01-01",
  end_time: "2024-02-29",
  strategy_type: "mean_reversion",
  interval: "1h",
  initial_capital: 10000,
};

const plan = generateBacktestPlan(params);
```

**Expected Plan Output:**
- Research Question: Do price extremes reliably revert to mean?
- Hypothesis: Price deviations from averages tend to revert
- Key Assumptions: Price extremes are identifiable, reversion occurs in tradeable timeframes
- Risk Considerations: Unlimited downside if trend continues, structural break risk

## Directory Structure

```
backtest-planner/
├── SKILL.md                          # This file
├── scripts/
│   └── backtestPlanner.ts            # Main implementation
└── references/                       # Additional reference materials
```

## API Reference

### `validateBacktestParams(params)`

Validates backtest parameters and returns validation results.

**Parameters:**
- `params` (BacktestParams): Backtest parameters
  - `market_condition_id` (string, required): Market condition identifier
  - `start_time` (Date/string, required): Backtest start time
  - `end_time` (Date/string, required): Backtest end time
  - `strategy_type` (StrategyType, required): One of: event_driven, price_driven, momentum, mean_reversion
  - `interval` (DataInterval, optional): Data interval (1m, 1h, 1d)
  - `initial_capital` (number, optional): Starting capital
  - `position_size` (number, optional): Position size (0-1)

**Returns:**
- `ValidationResult` with `is_valid` (boolean) and `errors` (string[])

### `calculateDataRequirements(params)`

Calculates data requirements for a backtest.

**Returns:**
- `DataRequirements` with:
  - `estimated_api_calls` (number): Estimated number of API calls needed
  - `estimated_data_points` (number): Total data points required
  - `interval` (string): Data interval
  - `duration_days` (number): Duration in days
  - `requires_trade_history` (boolean): Whether trade history is needed
  - `requires_candlesticks` (boolean): Whether candlestick data is needed
  - `estimated_data_size_mb` (number): Estimated data size in MB

### `generateBacktestPlan(params)`

Generates a complete backtest plan with research framework.

**Returns:**
- `BacktestPlan` with:
  - `research_question` (string): Research question for the backtest
  - `hypothesis` (string): Testable hypothesis
  - `market_condition_id` (string): Market being tested
  - `time_range` (object): Start and end times
  - `strategy_type` (string): Strategy type
  - `data_requirements` (object): Data requirements
  - `assumptions` (string[]): Strategy assumptions
  - `constraints` (string[]): Strategy constraints
  - `expected_outputs` (string[]): Expected analysis outputs
  - `risk_considerations` (string[]): Risk factors to consider
  - `success_criteria` (string[]): Criteria for evaluating success

### `checkDataCoverage(apiKey, params)`

Checks if data covers the requested period.

**Parameters:**
- `apiKey` (string): API key for authentication
- `params` (BacktestParams): Backtest parameters

**Returns:**
- `CoverageResult` with:
  - `has_coverage` (boolean): Whether data covers the range
  - `coverage_percentage` (number): Percentage of range covered
  - `gaps` (Array): List of uncovered time ranges
  - `recommendations` (string[]): Recommendations for addressing gaps

### `estimateApiCosts(dataRequirements)`

Estimates API costs for data fetching.

**Parameters:**
- `dataRequirements` (DataRequirements): Output from `calculateDataRequirements()`

**Returns:**
- `CostEstimate` with:
  - `estimated_calls` (number): Estimated API calls
  - `estimated_cost_usd` (number): Estimated cost in USD
  - `cost_breakdown` (object): Cost breakdown by category
  - `optimization_suggestions` (string[]): Suggestions to reduce costs

## Resources

### scripts/
- `backtestPlanner.ts` - Main TypeScript module with all functions
