/**
 * Real API test for activity-monitor
 * Tests actual API calls and data processing
 */

import {
  fetchActivity,
  fetchAllActivity,
  parseActivity,
  filterMergesSplitsRedeems,
  trackLargeTransactions,
  analyzeActivityPatterns,
  detectMarketClosingSignals,
} from "./packages/plugins/dome-data/skills/activity-monitor/scripts/activityMonitor.js";

const API_KEY = process.env.DOME_API_KEY || "";

if (!API_KEY) {
  console.error("❌ Error: DOME_API_KEY environment variable is required");
  console.log("Usage: DOME_API_KEY=your_key node test-real-activity.js");
  process.exit(1);
}

async function runRealTests() {
  console.log("🧪 Running real API tests for activity-monitor...\n");

  try {
    // Test 1: Fetch recent activity
    console.log("=" .repeat(60));
    console.log("Test 1: Fetch recent activity");
    console.log("=" .repeat(60));

    const result = await fetchActivity(API_KEY, { limit: 100 });
    console.log(`✅ Fetched ${result.activities.length} activities`);
    console.log(`   Pagination: has_more=${result.pagination.has_more}`);

    if (result.activities.length > 0) {
      const first = result.activities[0];
      console.log(`\n   First activity:`);
      console.log(`   - Type: ${first.type || first.side || 'undefined'}`);
      console.log(`   - Token: ${first.token_id?.slice(0, 30)}...`);
      console.log(`   - Market: ${first.market_slug || 'N/A'}`);
      console.log(`   - Shares: ${first.shares_normalized}`);
      console.log(`   - User: ${first.user?.slice(0, 30)}...`);
    }

    // Test 2: Parse activity with type field
    console.log(`\n${"=".repeat(60)}`);
    console.log("Test 2: Parse activity (handles 'type' field)");
    console.log("=" .repeat(60));

    if (result.activities.length > 0) {
      const rawActivity = result.activities[0];
      const parsed = parseActivity(rawActivity);

      console.log(`✅ Parsed activity:`);
      console.log(`   - side: ${parsed.side}`);
      console.log(`   - token_id: ${parsed.token_id?.slice(0, 30)}...`);
      console.log(`   - shares: ${parsed.shares_normalized}`);

      // Verify type field is handled
      if (parsed.side === 'MERGE' || parsed.side === 'SPLIT' || parsed.side === 'REDEEM') {
        console.log(`   ✅ Type field correctly handled: ${parsed.side}`);
      } else {
        console.log(`   ⚠️  Unexpected side value: ${parsed.side}`);
      }
    }

    // Test 3: Filter by type
    console.log(`\n${"=".repeat(60)}`);
    console.log("Test 3: Filter activities by type");
    console.log("=" .repeat(60));

    const redeems = filterMergesSplitsRedeems(result.activities, {
      types: ["REDEEM"],
    });
    console.log(`✅ Filtered REDEEM activities: ${redeems.length}`);

    const splits = filterMergesSplitsRedeems(result.activities, {
      types: ["SPLIT"],
    });
    console.log(`✅ Filtered SPLIT activities: ${splits.length}`);

    const merges = filterMergesSplitsRedeems(result.activities, {
      types: ["MERGE"],
    });
    console.log(`✅ Filtered MERGE activities: ${merges.length}`);

    // Test 4: Track large transactions
    console.log(`\n${"=".repeat(60)}`);
    console.log("Test 4: Track large transactions");
    console.log("=" .repeat(60));

    const largeTx = trackLargeTransactions(result.activities, {
      threshold: 1000,
    });
    console.log(`✅ Large transactions (>1000): ${largeTx.length}`);

    const top10Percent = trackLargeTransactions(result.activities, {
      percentile: 90,
    });
    console.log(`✅ Top 10% by size: ${top10Percent.length}`);

    // Test 5: Analyze patterns
    console.log(`\n${"=".repeat(60)}`);
    console.log("Test 5: Analyze activity patterns");
    console.log("=" .repeat(60));

    const analysis = analyzeActivityPatterns(result.activities);
    console.log(`✅ Analysis complete:`);
    console.log(`   - Total count: ${analysis.total_count}`);
    console.log(`   - Type distribution:`);
    console.log(`     * MERGE: ${analysis.type_distribution.MERGE}`);
    console.log(`     * SPLIT: ${analysis.type_distribution.SPLIT}`);
    console.log(`     * REDEEM: ${analysis.type_distribution.REDEEM}`);
    console.log(`   - Clusters: ${analysis.clusters.length}`);
    console.log(`   - Suspicious patterns: ${analysis.suspicious_patterns.length}`);
    console.log(`   - Top users: ${analysis.top_users.length}`);

    // Test 6: Detect market closing signals
    console.log(`\n${"=".repeat(60)}`);
    console.log("Test 6: Detect market closing signals");
    console.log("=" .repeat(60));

    const signals = detectMarketClosingSignals(result.activities);
    console.log(`✅ Closing signals: ${signals.length}`);

    if (signals.length > 0) {
      signals.slice(0, 3).forEach((signal, i) => {
        console.log(`   ${i + 1}. ${signal.market_slug} (confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
      });
    }

    // Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ All real API tests passed!");
    console.log("=" .repeat(60));

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

runRealTests();
