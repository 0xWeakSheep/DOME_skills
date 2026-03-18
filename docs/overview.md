# DOME Skills Overview

The DOME Skills repository provides a comprehensive toolkit for analyzing Polymarket prediction market data and conducting quantitative research.

## What is DOME?

DOME (Data Oracle for Market Events) provides structured access to Polymarket prediction market data, enabling researchers, traders, and developers to:

- Access historical market data for backtesting
- Analyze market microstructure and trading patterns
- Build and validate trading strategies
- Conduct event-driven research

## Repository Structure

```
DOME_skills/
├── docs/                           # Documentation
│   ├── overview.md                 # This file
│   ├── architecture/               # System architecture
│   ├── plugins/                    # Plugin documentation
│   └── skills/                     # Skill documentation
├── packages/plugins/               # Plugin implementations
│   ├── dome-data/                  # Data access skills
│   └── dome-backtesting/           # Backtesting skills
├── tests/
│   ├── unit/                       # Unit tests
│   └── example/                    # Usage examples
└── README.md                       # Main repository README
```

## Core Capabilities

### 1. Market Discovery

Find and filter prediction markets based on:
- Keywords and tags (crypto, politics, sports)
- Volume thresholds
- Market status (active, closed, resolved)
- Date ranges
- Duration requirements

**Use case:** Identify suitable markets for backtesting a crypto trading strategy.

### 2. Historical Data Access

Retrieve comprehensive market data:
- **Trade history**: Individual transactions with prices, volumes, timestamps
- **Candlestick data**: OHLCV at 1m, 1h, 1d intervals
- **Orderbook snapshots**: Bid-ask spreads and liquidity depth

**Use case:** Analyze market microstructure around significant events.

### 3. Technical Analysis

Calculate indicators and detect patterns:
- Moving averages (SMA, EMA)
- Volatility measures
- Trend detection
- Support/resistance levels
- Price divergence analysis

**Use case:** Generate trading signals based on technical indicators.

### 4. Backtest Planning

Design rigorous quantitative research:
- Parameter validation
- Data requirement estimation
- Cost estimation
- Hypothesis generation
- Risk assessment

**Use case:** Validate a momentum strategy before live trading.

## Workflow Example

A typical research workflow using DOME Skills:

```
1. DISCOVER → Find high-volume crypto markets
              ↓
2. VALIDATE → Check data coverage and time range
              ↓
3. FETCH    → Retrieve candlestick and trade data
              ↓
4. ANALYZE  → Calculate indicators, detect patterns
              ↓
5. PLAN     → Design backtest with clear hypothesis
              ↓
6. EXECUTE  → Run backtest (future capability)
              ↓
7. EVALUATE → Assess results against success criteria
```

## Data Coverage

### Time Ranges

| Interval | Maximum | Best For |
|----------|---------|----------|
| 1 minute | 1 week | High-frequency strategies |
| 1 hour | 1 month | Technical analysis |
| 1 day | 1 year | Long-term research |

### Market Types

- **Binary markets**: Yes/No outcomes (e.g., "Will Bitcoin hit $100k?")
- **Categorical markets**: Multiple outcomes
- **Scalar markets**: Numerical ranges

## Getting Started

### Prerequisites

- DOME API key
- Node.js 18+ (for TypeScript implementation)

### Quick Start

1. **Set up environment:**
   ```bash
   export DOME_API_KEY="your_api_key_here"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Explore examples:**
   See `tests/example/` for detailed usage scenarios.

## Plugins

### dome-data

Core data access capabilities for market discovery, trade history, candlestick analysis, and orderbook replay.

**See:** `packages/plugins/dome-data/`

### dome-backtesting

Backtest planning and validation tools for designing quantitative research.

**See:** `packages/plugins/dome-backtesting/`

## Philosophy

- **Research-first**: Design around rigorous quantitative research practices
- **Composable**: Skills work independently and together
- **Transparent**: Clear documentation of data limitations and assumptions
- **Testable**: Comprehensive test coverage for all components

## Contributing

This repository follows test-driven development:

1. Define test cases first
2. Implement skill functionality
3. Validate with unit tests
4. Document with examples

## Resources

- [API Documentation](https://dome.api/docs)
- [Polymarket Documentation](https://docs.polymarket.com/)
- [Unit Tests](../tests/unit/)
- [Example Scenarios](../tests/example/)
