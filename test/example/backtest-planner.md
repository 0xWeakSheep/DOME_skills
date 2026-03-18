# Backtest Planner Skill - Example Scenarios

This document provides example scenarios for the backtest-planner skill, including trigger phrases, input conditions, and expected outputs.

## Scenario 1: Planning a Momentum Strategy Backtest

### Context
Researcher wants to validate a momentum-based trading strategy on historical prediction market data.

### Trigger Phrases
- "Plan a backtest for momentum strategy"
- "Help me design a trend-following backtest"
- "Create a backtest plan for market 0x1234..."
- "Validate my momentum strategy parameters"

### Input Conditions
```typescript
{
  market_condition_id: "0x6876ac2b6174778c973c118aac287c49057c4d5360f896729209fe985a2c07fb",
  start_time: "2024-01-01",
  end_time: "2024-03-01",
  strategy_type: "momentum",
  interval: "1h",
  initial_capital: 10000,
  position_size: 0.1
}
```

### Expected Output
Complete backtest plan with:
- Research question formulation
- Hypothesis statement
- Data requirements
- Assumptions and constraints
- Risk considerations
- Success criteria

### Anti-Patterns (Should NOT trigger this skill)
- "Run a backtest now" (execution, not planning)
- "Show me backtest results" (results analysis)
- "Optimize my strategy" (optimization, not planning)

---

## Scenario 2: Event-Driven Strategy Planning

### Context
Trader wants to analyze market behavior around specific events.

### Trigger Phrases
- "Plan an event-driven backtest"
- "Design a strategy for trading around market events"
- "Create a backtest for news-based trading"
- "Plan analysis around market resolution"

### Input Conditions
```typescript
{
  market_condition_id: "0xabc123...",
  start_time: "2024-01-01",
  end_time: "2024-01-31",
  strategy_type: "event_driven",
  interval: "1m",  // High frequency for event windows
  initial_capital: 5000
}
```

### Expected Output
Event-driven backtest plan:
- Event window definition
- Pre/post event analysis framework
- Volatility assumptions
- Execution timing considerations
- Risk management for binary events

---

## Scenario 3: Mean Reversion Strategy Validation

### Context
Quant researcher wants to test a contrarian mean-reversion strategy.

### Trigger Phrases
- "Plan a mean reversion backtest"
- "Design a contrarian strategy test"
- "Validate price extreme reversion hypothesis"
- "Plan backtest for overbought/oversold strategy"

### Input Conditions
```typescript
{
  market_condition_id: "0xdef456...",
  start_time: "2024-01-01",
  end_time: "2024-02-29",
  strategy_type: "mean_reversion",
  interval: "1h",
  initial_capital: 10000,
  position_size: 0.05  // Smaller size for risky contrarian
}
```

### Expected Output
Mean reversion plan with:
- Reversion threshold methodology
- Mean calculation approach
- Risk limits for trend continuation
- Entry/exit timing framework
- Stop-loss considerations

---

## Scenario 4: Parameter Validation

### Context
User wants to validate backtest parameters before execution.

### Trigger Phrases
- "Validate these backtest parameters"
- "Check if my backtest config is valid"
- "Are these parameters feasible?"
- "Validate my strategy setup"

### Input Conditions
```typescript
{
  market_condition_id: "0x1234...",
  start_time: "2024-01-01",
  end_time: "2024-06-01",  // 6 months
  strategy_type: "price_driven",
  interval: "1m"  // This will fail - exceeds 1 week limit
}
```

### Expected Output
Validation result:
```typescript
{
  is_valid: false,
  errors: [
    "Time range 182 days exceeds maximum 7 days for 1m interval"
  ]
}
```

---

## Scenario 5: Data Requirements Estimation

### Context
User wants to understand data needs and API costs before running backtest.

### Trigger Phrases
- "Calculate data requirements for this backtest"
- "How much data do I need?"
- "Estimate API calls for my backtest"
- "What's the cost to fetch this data?"

### Input Conditions
```typescript
{
  market_condition_id: "0x1234...",
  start_time: "2024-01-01",
  end_time: "2024-02-01",
  strategy_type: "momentum",
  interval: "1h"
}
```

### Expected Output
Data requirements analysis:
- Number of API calls needed
- Estimated data size
- Time to fetch
- Cost estimate
- Optimization suggestions

---

## Data Limitations Reference

| Interval | Max Range | Typical API Calls |
|----------|-----------|-------------------|
| 1m | 1 week | 1 per week |
| 1h | 1 month | 1 per month |
| 1d | 1 year | 1 per year |

## Strategy Type Characteristics

| Strategy | Data Required | Risk Level | Time Horizon |
|----------|--------------|------------|--------------|
| event_driven | Trade history + timestamps | High | Minutes/Hours |
| price_driven | Candlestick OHLCV | Medium | Hours/Days |
| momentum | Candlestick + volume | Medium | Days/Weeks |
| mean_reversion | Candlestick + indicators | High | Days |

## Common Error Cases

1. **Invalid time range**: start_time >= end_time → ValidationError
2. **Invalid strategy type**: strategy_type = "invalid" → ValidationError
3. **Range exceeds limit**: 1m with 30 days → ValidationError
4. **Missing required field**: No market_condition_id → ValidationError

## Example Workflow

### Complete Backtest Planning

```typescript
// Step 1: Define parameters
const params = {
  market_condition_id: "0x1234...",
  start_time: new Date("2024-01-01"),
  end_time: new Date("2024-03-01"),
  strategy_type: "momentum" as StrategyType,
  interval: "1h" as DataInterval,
  initial_capital: 10000
};

// Step 2: Validate
const validation = validateBacktestParams(params);
if (!validation.is_valid) {
  console.error("Validation errors:", validation.errors);
  return;
}

// Step 3: Check data coverage
const coverage = checkDataCoverage(
  params.market_condition_id,
  params.start_time,
  params.end_time,
  "candlesticks",
  params.interval
);

if (!coverage.has_coverage) {
  console.warn("Coverage issues:", coverage.recommendations);
}

// Step 4: Calculate requirements
const requirements = calculateDataRequirements(params);
console.log(`API calls needed: ${requirements.estimated_api_calls}`);

// Step 5: Estimate costs
const costs = estimateApiCosts(requirements);
console.log(`Estimated cost: $${costs.estimated_cost_usd}`);

// Step 6: Generate plan
const plan = generateBacktestPlan(params);
console.log("Research Question:", plan.research_question);
console.log("Hypothesis:", plan.hypothesis);
console.log("Assumptions:", plan.assumptions);
console.log("Risk Considerations:", plan.risk_considerations);
```
