# DOME Backtesting Plugin

The `dome-backtesting` plugin provides skills for designing, validating, and executing research-driven backtests on Polymarket prediction market data.

## Purpose

This plugin enables quantitative researchers to:

- Transform research questions into structured backtest plans
- Validate backtest parameters against data constraints
- Estimate data requirements and API costs
- Design event-driven and price-driven trading strategies

## Skills

### backtest-planner

Transform research ideas into executable backtest plans with clear hypotheses, assumptions, and constraints.

**Key capabilities:**
- Validate backtest parameters (time ranges, intervals, strategy types)
- Calculate data requirements and API call estimates
- Check data coverage for specified time periods
- Generate structured backtest plans with research questions
- Estimate costs before execution

**Location:** `skills/backtest-planner/`

## Strategy Types

The backtest planner supports four strategy types:

| Strategy | Data Required | Risk Level | Time Horizon | Best For |
|----------|--------------|------------|--------------|----------|
| `event_driven` | Trade history + timestamps | High | Minutes/Hours | Trading around specific events |
| `price_driven` | Candlestick OHLCV | Medium | Hours/Days | Technical pattern trading |
| `momentum` | Candlestick + volume | Medium | Days/Weeks | Trend-following strategies |
| `mean_reversion` | Candlestick + indicators | High | Days | Contrarian strategies |

## Parameter Validation Rules

### Time Range by Interval

| Interval | Maximum Range | Example |
|----------|---------------|---------|
| 1m | 7 days | 1 week of minute data |
| 1h | 30 days | 1 month of hourly data |
| 1d | 365 days | 1 year of daily data |

### Required Parameters

```typescript
{
  market_condition_id: string,    // Market identifier
  start_time: string | Date,      // Backtest start
  end_time: string | Date,        // Backtest end
  strategy_type: StrategyType,    // One of the four types
  interval: DataInterval          // 1m, 1h, or 1d
}
```

### Optional Parameters

```typescript
{
  initial_capital?: number,       // Starting capital (default: 10000)
  position_size?: number,         // Position sizing (default: 0.1)
  max_positions?: number,         // Max concurrent positions
  stop_loss_pct?: number,         // Stop loss percentage
  take_profit_pct?: number        // Take profit percentage
}
```

## Directory Structure

```
dome-backtesting/
├── README.md
└── skills/
    └── backtest-planner/
        ├── SKILL.md
        ├── references/
        │   └── strategy-templates.md
        └── scripts/
            └── backtestPlanner.ts
```

## Usage Example

```typescript
import {
  validateBacktestParams,
  calculateDataRequirements,
  generateBacktestPlan,
  checkDataCoverage,
  estimateApiCosts
} from './skills/backtest-planner/scripts/backtestPlanner.js';

// Define backtest parameters
const params = {
  market_condition_id: "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  strategy_type: "momentum" as StrategyType,
  interval: "1h" as DataInterval,
  initial_capital: 10000,
  position_size: 0.1
};

// Step 1: Validate parameters
const validation = validateBacktestParams(params);
if (!validation.is_valid) {
  console.error("Validation errors:", validation.errors);
  return;
}

// Step 2: Check data coverage
const coverage = await checkDataCoverage(apiKey, params);
if (!coverage.has_coverage) {
  console.warn("Coverage issues:", coverage.recommendations);
}

// Step 3: Calculate requirements
const requirements = calculateDataRequirements(params);
console.log(`API calls needed: ${requirements.estimated_api_calls}`);

// Step 4: Estimate costs
const costs = estimateApiCosts(requirements);
console.log(`Estimated cost: $${costs.estimated_cost_usd}`);

// Step 5: Generate backtest plan
const plan = generateBacktestPlan(params);
console.log("Research Question:", plan.research_question);
console.log("Hypothesis:", plan.hypothesis);
console.log("Assumptions:", plan.assumptions);
console.log("Risk Considerations:", plan.risk_considerations);
```

## Backtest Plan Output

A complete backtest plan includes:

```typescript
{
  research_question: string,      // Clear research question
  hypothesis: string,             // Testable hypothesis
  assumptions: string[],          // List of assumptions
  data_requirements: {
    required_endpoints: string[], // APIs needed
    estimated_api_calls: number,  // Total API calls
    time_range: { start: Date, end: Date }
  },
  risk_considerations: string[],  // Risk factors
  success_criteria: string[],     // How to evaluate results
  limitations: string[]           // Known limitations
}
```

## Common Error Cases

1. **Invalid time range**: `start_time >= end_time` → ValidationError
2. **Invalid strategy type**: `strategy_type = "invalid"` → ValidationError
3. **Range exceeds limit**: 1m interval with 30 days → ValidationError
4. **Missing required field**: No `market_condition_id` → ValidationError

## Integration with dome-data

The backtest planner works closely with the `dome-data` plugin:

1. Use `market-discovery` to find suitable markets
2. Use `candlestick-analysis` to validate data availability
3. Use `historical-trades` for event-driven strategies
4. Use `backtest-planner` to design and validate the backtest

## Best Practices

1. **Always validate first**: Run `validateBacktestParams()` before any other operations
2. **Check data coverage**: Use `checkDataCoverage()` to ensure data exists for your time range
3. **Estimate costs upfront**: Avoid surprises by estimating API costs before execution
4. **Start small**: Test with shorter time ranges before running full backtests
5. **Document assumptions**: The plan's assumptions section helps with reproducibility
