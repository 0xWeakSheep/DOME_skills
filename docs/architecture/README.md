# Architecture Documentation

This directory contains architecture documentation for the DOME Skills repository.

## Overview

The DOME Skills architecture follows a plugin-based design where capabilities are organized into logical groups called **plugins**, and individual capabilities are implemented as **skills**.

## Core Concepts

### Plugin

A plugin is a container for related skills. It defines:
- The domain of functionality (data access, backtesting, wallet analysis)
- Shared dependencies and configuration
- Common error handling patterns
- Documentation and references

**Example:** `dome-data` plugin contains all data access skills.

### Skill

A skill is a discrete capability with:
- A clear purpose and scope
- Defined inputs and outputs
- Associated scripts for execution
- Documentation and examples

**Example:** `market-discovery` skill enables finding and filtering markets.

### Script

Scripts are TypeScript implementations that provide:
- API client functions
- Data transformation logic
- Validation functions
- Utility helpers

**Example:** `marketDiscovery.ts` implements market discovery functions.

## Directory Structure

```
packages/plugins/{plugin-name}/
├── README.md                     # Plugin documentation
└── skills/
    └── {skill-name}/
        ├── SKILL.md              # Skill definition
        ├── references/           # Reference materials
        └── scripts/              # Implementation scripts
            └── {skillName}.ts
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Request                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Skill Selection                           │
│         (Based on trigger phrases in SKILL.md)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Script Execution                          │
│              (TypeScript functions in scripts/)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOME API Request                          │
│          (HTTP requests with proper authentication)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response Processing                       │
│         (Parsing, validation, transformation)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Output                                  │
│         (Structured data, analysis, or plan)                │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

All skills use a consistent error handling approach:

### Error Types

| Error | Purpose | HTTP Status |
|-------|---------|-------------|
| `DomeAPIError` | Generic API failures | 400-599 |
| `DomeAPIValidationError` | Invalid API parameters | 400 |
| `DomeAPIRateLimitError` | Rate limit exceeded | 429 |
| `ValidationError` | Client-side validation | N/A |
| `DataCoverageError` | Missing data coverage | N/A |

### Error Structure

```typescript
interface DomeAPIError {
  message: string;
  statusCode?: number;
  responseData?: any;
}
```

## Type System

All skills use TypeScript with strict typing:

### Common Types

```typescript
// Pagination
interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  items_per_page: number;
  pagination_key?: string;
}

// Time intervals
const INTERVALS = {
  MINUTE: 1,
  HOUR: 60,
  DAY: 1440
} as const;

// Strategy types
const STRATEGY_TYPES = [
  'event_driven',
  'price_driven',
  'momentum',
  'mean_reversion'
] as const;
```

## Testing Strategy

### Unit Tests

Located in `tests/unit/`, validate:
- Input parameter parsing
- API request construction
- Data transformation logic
- Error handling

### Example Tests

Located in `tests/example/`, document:
- Trigger phrases for skill activation
- Expected inputs and outputs
- Anti-patterns (what NOT to trigger)

## Plugin Interactions

```
┌─────────────────┐     ┌─────────────────┐
│   dome-data     │────▶│ dome-backtesting│
│                 │     │                 │
│ - market-       │     │ - backtest-     │
│   discovery     │     │   planner       │
│ - historical-   │     │                 │
│   trades        │     │ Uses data from  │
│ - candlestick-  │     │ dome-data to    │
│   analysis      │     │ plan backtests  │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  dome-wallet    │
│                 │
│ - wallet-       │
│   analysis      │
│ - pnl-analysis  │
└─────────────────┘
```

## Future Extensions

Planned plugins:
- `dome-wallet`: Wallet analysis and PnL tracking
- `dome-research`: Research hypothesis generation
