# Backtest Planner Skill

Design and validate quantitative research plans for backtesting trading strategies on Polymarket data.

## Purpose

Transform research questions into structured, reproducible backtest plans with clear hypotheses, assumptions, constraints, and success criteria.

## Trigger Phrases

- "Plan a backtest for momentum strategy"
- "Help me design a trend-following backtest"
- "Create a backtest plan for market 0x1234..."
- "Validate my momentum strategy parameters"
- "Plan an event-driven backtest"
- "Design a strategy for trading around market events"
- "Plan a mean reversion backtest"
- "Validate these backtest parameters"
- "Calculate data requirements for this backtest"
- "How much data do I need?"

## Anti-Patterns (Should NOT Trigger)

- "Run a backtest now" (execution, not planning)
- "Show me backtest results" (results analysis)
- "Optimize my strategy" (optimization, not planning)

## Key Functions

### validateBacktestParams()

Validate parameters against constraints.

```typescript
function validateBacktestParams(params: BacktestParams): ValidationResult
```

**Returns:**

```typescript
interface ValidationResult {
  is_valid: boolean;
  errors: string[];
}
```

### calculateDataRequirements()

Estimate data needs for the backtest.

```typescript
function calculateDataRequirements(params: BacktestParams): DataRequirements
```

**Returns:**

| Field | Description |
|-------|-------------|
| `required_endpoints` | APIs needed |
| `estimated_api_calls` | Total API calls required |
| `time_range` | Start and end dates |
| `interval_seconds` | Data granularity |
| `estimated_data_points` | Total data points |

### checkDataCoverage()

Verify data availability for the time range.

```typescript
async function checkDataCoverage(
  apiKey: string,
  params: BacktestParams
): Promise<CoverageResult>
```

**Returns:**

```typescript
interface CoverageResult {
  has_coverage: boolean;
  coverage_percentage: number;
  gaps: Array<{ start: Date; end: Date }>;
  recommendations: string[];
}
```

### estimateApiCosts()

Estimate execution costs.

```typescript
function estimateApiCosts(requirements: DataRequirements): CostEstimate
```

**Returns:**

```typescript
interface CostEstimate {
  estimated_api_calls: number;
  estimated_cost_usd: number;
  cost_breakdown: Record<string, number>;
}
```

### generateBacktestPlan()

Generate complete backtest plan.

```typescript
function generateBacktestPlan(params: BacktestParams): BacktestPlan
```

**Returns:** `BacktestPlan` with research question, hypothesis, assumptions, and more.

## Data Types

### BacktestParams

```typescript
interface BacktestParams {
  market_condition_id: string;
  start_time: string | Date;
  end_time: string | Date;
  strategy_type: StrategyType;
  interval: DataInterval;
  initial_capital?: number;     // Default: 10000
  position_size?: number;       // Default: 0.1
  max_positions?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
}
```

### StrategyType

```typescript
type StrategyType = 'event_driven' | 'price_driven' | 'momentum' | 'mean_reversion';
```

| Type | Description | Risk Level | Time Horizon |
|------|-------------|------------|--------------|
| `event_driven` | Trade around events | High | Minutes/Hours |
| `price_driven` | Technical patterns | Medium | Hours/Days |
| `momentum` | Trend-following | Medium | Days/Weeks |
| `mean_reversion` | Contrarian | High | Days |

### DataInterval

```typescript
type DataInterval = '1m' | '1h' | '1d';
```

### BacktestPlan

```typescript
interface BacktestPlan {
  research_question: string;
  hypothesis: string;
  assumptions: string[];
  data_requirements: DataRequirements;
  risk_considerations: string[];
  success_criteria: string[];
  limitations: string[];
}
```

## Time Range Limits

| Interval | Maximum | Error Message |
|----------|---------|---------------|
| 1m | 7 days | "Time range X days exceeds maximum 7 days for 1m interval" |
| 1h | 30 days | "Time range X days exceeds maximum 30 days for 1h interval" |
| 1d | 365 days | "Time range X days exceeds maximum 365 days for 1d interval" |

## Examples

### Plan a Momentum Strategy Backtest

```typescript
const params = {
  market_condition_id: '0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb',
  start_time: '2024-01-01',
  end_time: '2024-03-01',
  strategy_type: 'momentum' as StrategyType,
  interval: '1h' as DataInterval,
  initial_capital: 10000,
  position_size: 0.1
};

// Validate
const validation = validateBacktestParams(params);
if (!validation.is_valid) {
  console.error('Errors:', validation.errors);
  return;
}

// Generate plan
const plan = generateBacktestPlan(params);
console.log('Research Question:', plan.research_question);
console.log('Hypothesis:', plan.hypothesis);
console.log('Assumptions:', plan.assumptions);
console.log('Risk Considerations:', plan.risk_considerations);
console.log('Success Criteria:', plan.success_criteria);
```

### Event-Driven Strategy Planning

```typescript
const params = {
  market_condition_id: '0xabc123...',
  start_time: '2024-01-01',
  end_time: '2024-01-31',
  strategy_type: 'event_driven',
  interval: '1m',  // High frequency for event windows
  initial_capital: 5000
};

const plan = generateBacktestPlan(params);
// Includes event window definition, volatility assumptions
```

### Mean Reversion Strategy Validation

```typescript
const params = {
  market_condition_id: '0xdef456...',
  start_time: '2024-01-01',
  end_time: '2024-02-29',
  strategy_type: 'mean_reversion',
  interval: '1h',
  initial_capital: 10000,
  position_size: 0.05  // Smaller for risky contrarian
};

const plan = generateBacktestPlan(params);
// Includes reversion threshold methodology, stop-loss considerations
```

### Parameter Validation

```typescript
const params = {
  market_condition_id: '0x1234...',
  start_time: '2024-01-01',
  end_time: '2024-06-01',  // 6 months
  strategy_type: 'price_driven',
  interval: '1m'  // This will fail - exceeds 1 week limit
};

const validation = validateBacktestParams(params);
// validation.is_valid = false
// validation.errors = ["Time range 182 days exceeds maximum 7 days for 1m interval"]
```

### Data Requirements Estimation

```typescript
const params = {
  market_condition_id: '0x1234...',
  start_time: '2024-01-01',
  end_time: '2024-02-01',
  strategy_type: 'momentum',
  interval: '1h'
};

// Calculate requirements
const requirements = calculateDataRequirements(params);
console.log('API calls needed:', requirements.estimated_api_calls);
console.log('Data points:', requirements.estimated_data_points);

// Estimate costs
const costs = estimateApiCosts(requirements);
console.log('Estimated cost: $', costs.estimated_cost_usd);
```

### Complete Workflow

```typescript
async function planBacktest(apiKey: string, params: BacktestParams) {
  // Step 1: Validate
  const validation = validateBacktestParams(params);
  if (!validation.is_valid) {
    return { error: 'Validation failed', details: validation.errors };
  }

  // Step 2: Check coverage
  const coverage = await checkDataCoverage(apiKey, params);
  if (!coverage.has_coverage) {
    console.warn('Coverage issues:', coverage.recommendations);
  }

  // Step 3: Calculate requirements
  const requirements = calculateDataRequirements(params);

  // Step 4: Estimate costs
  const costs = estimateApiCosts(requirements);

  // Step 5: Generate plan
  const plan = generateBacktestPlan(params);

  return {
    plan,
    requirements,
    costs,
    coverage,
    is_valid: true
  };
}
```

## Error Handling

```typescript
const result = validateBacktestParams(params);

if (!result.is_valid) {
  result.errors.forEach(error => {
    if (error.includes('Missing required')) {
      // Add missing parameter
    } else if (error.includes('exceeds maximum')) {
      // Adjust time range or interval
    } else if (error.includes('Invalid')) {
      // Fix parameter value
    }
  });
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required field: X" | Required parameter not provided | Add the parameter |
| "Invalid strategy type" | Strategy not in allowed list | Use valid strategy type |
| "Invalid interval" | Interval not 1m, 1h, or 1d | Use supported interval |
| "Time range exceeds limit" | Range too long | Shorten range or use coarser interval |
| "start_time must be before end_time" | Invalid order | Swap timestamps |

## Backtest Plan Components

### Research Question

Clear, focused question that drives the backtest:

> "Does a simple momentum strategy generate positive risk-adjusted returns on high-volume crypto prediction markets?"

### Hypothesis

Testable prediction with clear metrics:

> "Markets with positive 5-day returns will continue to outperform over the next 5 days with a win rate > 55%."

### Assumptions

Documented assumptions for reproducibility:

- Sufficient liquidity for position entry/exit
- No slippage on orders
- Continuous price data availability
- Strategy signals do not affect market prices
- No transaction costs

### Risk Considerations

Factors that could invalidate results:

- Binary event risk (sudden market resolution)
- Low liquidity during off-hours
- News-driven price gaps
- Correlation breakdown during stress periods
- Look-ahead bias in data

### Success Criteria

Clear metrics for evaluating results:

- Sharpe ratio > 1.0
- Maximum drawdown < 20%
- Win rate > 50%
- Profit factor > 1.5
- Statistically significant sample size

### Limitations

Known constraints:

- Limited historical data for some markets
- Survivorship bias in market selection
- Simplified execution assumptions
- No consideration of market impact

## Best Practices

1. **Always validate first** - Run `validateBacktestParams()` before other operations
2. **Check data coverage** - Verify data exists before committing to analysis
3. **Estimate costs upfront** - Avoid surprise API bills
4. **Document everything** - Assumptions, limitations, and rationale
5. **Start small** - Test with shorter time ranges before scaling
6. **Define success criteria** - Know what "good" looks like
7. **Consider multiple markets** - Single market results may not generalize
