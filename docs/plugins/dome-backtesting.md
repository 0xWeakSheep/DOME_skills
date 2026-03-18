# DOME Backtesting Plugin Documentation

The `dome-backtesting` plugin provides tools for designing and validating quantitative research on Polymarket data.

## Purpose

Transform research questions into structured, reproducible backtest plans with clear hypotheses, assumptions, and constraints.

## Skills

### backtest-planner

**Purpose:** Design and validate backtest plans

**Key Functions:**
- `validateBacktestParams()` - Validate parameters against constraints
- `calculateDataRequirements()` - Estimate data needs
- `checkDataCoverage()` - Verify data availability
- `estimateApiCosts()` - Estimate execution costs
- `generateBacktestPlan()` - Generate structured research plan

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `market_condition_id` | string | Yes | Market identifier |
| `start_time` | string \| Date | Yes | Backtest start |
| `end_time` | string \| Date | Yes | Backtest end |
| `strategy_type` | StrategyType | Yes | Type of strategy |
| `interval` | DataInterval | Yes | Data granularity |
| `initial_capital` | number | No | Starting capital (default: 10000) |
| `position_size` | number | No | Position sizing (default: 0.1) |

**Strategy Types:**

| Type | Description | Risk Level |
|------|-------------|------------|
| `event_driven` | Trade around specific events | High |
| `price_driven` | Technical pattern trading | Medium |
| `momentum` | Trend-following | Medium |
| `mean_reversion` | Contrarian strategies | High |

**Time Range Validation:**

| Interval | Maximum Range | Error if Exceeded |
|----------|---------------|-------------------|
| 1m | 1 week | "Time range X days exceeds maximum 7 days for 1m interval" |
| 1h | 1 month | "Time range X days exceeds maximum 30 days for 1h interval" |
| 1d | 1 year | "Time range X days exceeds maximum 365 days for 1d interval" |

## Backtest Plan Structure

A complete backtest plan includes:

```typescript
interface BacktestPlan {
  research_question: string;
  hypothesis: string;
  assumptions: string[];
  data_requirements: {
    required_endpoints: string[];
    estimated_api_calls: number;
    time_range: { start: Date; end: Date };
  };
  risk_considerations: string[];
  success_criteria: string[];
  limitations: string[];
}
```

### Research Question

Clear, focused question the backtest aims to answer:

> "Does a simple momentum strategy generate positive returns on high-volume crypto prediction markets over 3-month periods?"

### Hypothesis

Testable prediction:

> "Markets showing 20% price movement over 5 days will continue moving in the same direction with 55% accuracy."

### Assumptions

List of assumptions made:

- Sufficient liquidity for position entry/exit
- No slippage on orders
- Continuous price data availability
- Strategy signals do not affect market prices

### Risk Considerations

Factors that could invalidate results:

- Binary event risk (sudden resolution)
- Low liquidity periods
- News-driven price gaps
- Correlation breakdown during stress

### Success Criteria

How to evaluate backtest results:

- Sharpe ratio > 1.0
- Maximum drawdown < 20%
- Win rate > 50%
- Profit factor > 1.5

## Usage Workflow

### Step 1: Define Parameters

```typescript
const params = {
  market_condition_id: "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  strategy_type: "momentum" as StrategyType,
  interval: "1h" as DataInterval,
  initial_capital: 10000,
  position_size: 0.1
};
```

### Step 2: Validate

```typescript
const validation = validateBacktestParams(params);
if (!validation.is_valid) {
  console.error("Validation errors:", validation.errors);
  return;
}
```

### Step 3: Check Coverage

```typescript
const coverage = await checkDataCoverage(apiKey, params);
if (!coverage.has_coverage) {
  console.warn("Coverage issues:", coverage.recommendations);
}
```

### Step 4: Estimate Requirements

```typescript
const requirements = calculateDataRequirements(params);
console.log(`API calls: ${requirements.estimated_api_calls}`);

const costs = estimateApiCosts(requirements);
console.log(`Estimated cost: $${costs.estimated_cost_usd}`);
```

### Step 5: Generate Plan

```typescript
const plan = generateBacktestPlan(params);
console.log("Research Question:", plan.research_question);
console.log("Hypothesis:", plan.hypothesis);
```

## Strategy Type Characteristics

### Event-Driven

**Best for:** Trading around known events (elections, earnings, resolutions)

**Data needed:** Trade history, timestamps

**Considerations:**
- High volatility around events
- Binary outcome risk
- Timing precision critical

**Example hypothesis:**
> "Markets experience elevated volatility in the 24 hours before resolution, creating mean-reversion opportunities."

### Price-Driven

**Best for:** Technical pattern trading

**Data needed:** OHLCV candlesticks

**Considerations:**
- Support/resistance levels
- Volume confirmation
- Trend vs range-bound markets

**Example hypothesis:**
> "Breakouts above resistance with 2x average volume predict 2% moves within 24 hours."

### Momentum

**Best for:** Trend-following strategies

**Data needed:** Candlesticks + volume

**Considerations:**
- Lookback period selection
- Entry timing
- Trend exhaustion

**Example hypothesis:**
> "Markets in the top quintile of 20-day returns continue outperforming over the next 5 days."

### Mean Reversion

**Best for:** Contrarian strategies on overextended moves

**Data needed:** Candlesticks + technical indicators

**Considerations:**
- High risk of catching falling knives
- Requires clear exit rules
- Works best in range-bound markets

**Example hypothesis:**
> "Prices deviating more than 3 standard deviations from 20-day mean revert within 48 hours."

## Validation Errors

Common validation failures:

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required field" | Required parameter not provided | Add the missing parameter |
| "Invalid strategy type" | Strategy not in allowed list | Use one of: event_driven, price_driven, momentum, mean_reversion |
| "Invalid interval" | Interval not supported | Use: 1m, 1h, or 1d |
| "Time range exceeds limit" | Range too long for interval | Shorten range or use coarser interval |
| "start_time must be before end_time" | Invalid time order | Swap timestamps |

## Cost Estimation

API costs depend on:

1. **Number of data points** - More granular = more calls
2. **Time range** - Longer = more calls
3. **Data types** - Multiple endpoints = more calls

Example estimates:

| Interval | 1 Month | 3 Months | 1 Year |
|----------|---------|----------|--------|
| 1h | ~1 call | ~3 calls | ~12 calls |
| 1d | ~1 call | ~1 call | ~1 call |

## Integration with dome-data

The backtest planner depends on `dome-data` for:

- Market discovery (`market-discovery`)
- Price data (`candlestick-analysis`)
- Trade data (`historical-trades`)

Ensure `dome-data` plugin is available when using `backtest-planner`.

## Best Practices

1. **Validate first** - Always run `validateBacktestParams()` before other operations
2. **Check coverage** - Verify data exists for your time range
3. **Estimate costs** - Avoid surprise API bills
4. **Document assumptions** - Critical for reproducibility
5. **Start small** - Test with shorter time ranges first
6. **Define success criteria** - Know what "good" looks like before running
