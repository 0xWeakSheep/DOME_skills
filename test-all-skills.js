/**
 * Comprehensive real API tests for all DOME skills
 * Tests actual API calls and data processing
 */

import {
  fetchMarkets,
  searchMarkets,
  parseMarketData,
} from "./packages/plugins/dome-data/skills/market-discovery/scripts/marketDiscovery.js";

import {
  fetchEvents,
  fetchEventBySlug,
} from "./packages/plugins/dome-data/skills/event-discovery/scripts/eventDiscovery.js";

import {
  fetchCandlesticks,
  calculateSMA,
  calculateVolatility,
  detectPriceTrends,
} from "./packages/plugins/dome-data/skills/candlestick-analysis/scripts/candlestickAnalysis.js";

import {
  fetchTrades,
  calculateTradeStats,
} from "./packages/plugins/dome-data/skills/historical-trades/scripts/historicalTrades.js";

import {
  fetchOrderbookHistory,
  parseOrderbookSnapshot,
  calculateSpread,
  analyzeLiquidity,
} from "./packages/plugins/dome-market-depth/skills/orderbook-analysis/scripts/orderbookAnalysis.js";

import {
  fetchActivity,
  parseActivity,
  analyzeActivityPatterns,
} from "./packages/plugins/dome-data/skills/activity-monitor/scripts/activityMonitor.js";

import {
  fetchWalletInfo,
  fetchPositions,
} from "./packages/plugins/dome-wallet/skills/wallet-analytics/scripts/walletAnalytics.js";

const API_KEY = process.env.DOME_API_KEY || "";

if (!API_KEY) {
  console.error("❌ Error: DOME_API_KEY environment variable is required");
  process.exit(1);
}

const TEST_MARKET_SLUG = "will-bitcoin-reach-150k-in-march-2026";
const TEST_CONDITION_ID = "0x561ffbf7de21ef3781c441f30536b026d2b301d7a4a0145a8f526f98db049ba2";
const TEST_WALLET = "0x6ac5bb06a9eb05641fd5e82640268b92f3ab4b6e";

async function runAllTests() {
  console.log("🧪 Running comprehensive real API tests...\n");
  const results = [];

  // Test 1: Market Discovery
  try {
    console.log("=" .repeat(60));
    console.log("📊 Test 1: Market Discovery");
    console.log("=" .repeat(60));

    const market = await fetchMarkets(API_KEY, { limit: 5 });
    console.log(`✅ Fetched ${market.markets.length} markets`);

    const parsed = parseMarketData(market.markets[0]);
    console.log(`✅ Parsed market: ${parsed.title.slice(0, 40)}...`);

    results.push({ skill: "market-discovery", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "market-discovery", status: "❌ FAIL", error: error.message });
  }

  // Test 2: Event Discovery
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📋 Test 2: Event Discovery");
    console.log("=" .repeat(60));

    const events = await fetchEvents(API_KEY, { limit: 5 });
    console.log(`✅ Fetched ${events.events.length} events`);

    if (events.events.length > 0) {
      const event = events.events[0];
      console.log(`✅ First event: ${event.title.slice(0, 40)}...`);
    }

    results.push({ skill: "event-discovery", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "event-discovery", status: "❌ FAIL", error: error.message });
  }

  // Test 3: Candlestick Analysis
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📈 Test 3: Candlestick Analysis");
    console.log("=" .repeat(60));

    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (24 * 60 * 60); // 24 hours

    const candlesticks = await fetchCandlesticks(API_KEY, TEST_CONDITION_ID, startTime, endTime, 60);
    console.log(`✅ Fetched ${candlesticks.length} candlestick series`);

    if (candlesticks.length > 0) {
      const series = candlesticks[0];
      console.log(`✅ Series: ${series.token_metadata.side}, ${series.candlesticks.length} candles`);

      if (series.candlesticks.length > 0) {
        const closes = series.candlesticks.map((c) => c.close_price);
        const sma = calculateSMA(closes, 10);
        console.log(`✅ Calculated SMA: ${sma[sma.length - 1]?.toFixed(4) || "N/A"}`);

        const trends = detectPriceTrends(series.candlesticks);
        console.log(`✅ Detected trend: ${trends.trend}`);
      }
    }

    results.push({ skill: "candlestick-analysis", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "candlestick-analysis", status: "❌ FAIL", error: error.message });
  }

  // Test 4: Historical Trades
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("💱 Test 4: Historical Trades");
    console.log("=" .repeat(60));

    const trades = await fetchTrades(API_KEY, {
      condition_id: TEST_CONDITION_ID,
      limit: 100,
    });
    console.log(`✅ Fetched ${trades.orders.length} trades`);

    if (trades.orders.length > 0) {
      const stats = calculateTradeStats(trades.orders);
      console.log(`✅ Trade stats: ${stats.total_trades} trades, volume: ${stats.total_volume.toFixed(2)}`);
    }

    results.push({ skill: "historical-trades", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "historical-trades", status: "❌ FAIL", error: error.message });
  }

  // Test 5: Orderbook Analysis
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📚 Test 5: Orderbook Analysis");
    console.log("=" .repeat(60));

    const YES_TOKEN = "73624432805780182150964443951045800666977811185963019133914618974858599458273";

    const orderbook = await fetchOrderbookHistory(API_KEY, YES_TOKEN, { limit: 1 });
    console.log(`✅ Fetched ${orderbook.snapshots.length} orderbook snapshots`);

    if (orderbook.snapshots.length > 0) {
      const parsed = parseOrderbookSnapshot(orderbook.snapshots[0]);
      console.log(`✅ Parsed snapshot: ${parsed.asks.length} asks, ${parsed.bids.length} bids`);

      const spread = calculateSpread(parsed.asks, parsed.bids);
      console.log(`✅ Spread: ${(spread.spread_percentage || 0).toFixed(2)}%`);

      const liquidity = analyzeLiquidity(parsed.asks, parsed.bids);
      console.log(`✅ Liquidity: ask=${liquidity.total_ask_liquidity.toFixed(2)}, bid=${liquidity.total_bid_liquidity.toFixed(2)}`);
      console.log(`✅ Depth 2%: ask=${liquidity.depth_2_percent.ask_depth.toFixed(2)}, bid=${liquidity.depth_2_percent.bid_depth.toFixed(2)}`);
    }

    results.push({ skill: "orderbook-analysis", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "orderbook-analysis", status: "❌ FAIL", error: error.message });
  }

  // Test 6: Activity Monitor
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔔 Test 6: Activity Monitor");
    console.log("=" .repeat(60));

    const activity = await fetchActivity(API_KEY, { limit: 50 });
    console.log(`✅ Fetched ${activity.activities.length} activities`);

    if (activity.activities.length > 0) {
      const parsed = parseActivity(activity.activities[0]);
      console.log(`✅ Parsed activity: type=${parsed.side}`);

      const analysis = analyzeActivityPatterns(activity.activities);
      console.log(`✅ Analysis: ${analysis.total_count} total, ${analysis.clusters.length} clusters`);
      console.log(`✅ Type distribution: MERGE=${analysis.type_distribution.MERGE}, SPLIT=${analysis.type_distribution.SPLIT}, REDEEM=${analysis.type_distribution.REDEEM}`);
    }

    results.push({ skill: "activity-monitor", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "activity-monitor", status: "❌ FAIL", error: error.message });
  }

  // Test 7: Wallet Analytics
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("👛 Test 7: Wallet Analytics");
    console.log("=" .repeat(60));

    const wallet = await fetchWalletInfo(API_KEY, { proxy: TEST_WALLET });
    console.log(`✅ Fetched wallet: ${wallet.display_name || wallet.proxy.slice(0, 20)}...`);

    const positions = await fetchPositions(API_KEY, wallet.proxy, { limit: 10 });
    console.log(`✅ Fetched ${positions.positions.length} positions`);

    results.push({ skill: "wallet-analytics", status: "✅ PASS" });
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`);
    results.push({ skill: "wallet-analytics", status: "❌ FAIL", error: error.message });
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Test Summary");
  console.log("=" .repeat(60));

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;

  results.forEach((r) => {
    console.log(`${r.status} ${r.skill}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed === 0) {
    console.log("\n🎉 All skills working correctly!");
  } else {
    console.log("\n⚠️  Some skills need attention");
    process.exit(1);
  }
}

runAllTests();
