/**
 * Batch Form Filler
 *
 * Generate multiple filled forms at once with unique run IDs.
 *
 * Usage:
 *   node batch-fill.js <count> [prefix] [--ai]
 *
 * Examples:
 *   node batch-fill.js 5                  # Creates claim-001 through claim-005
 *   node batch-fill.js 10 employee        # Creates employee-001 through employee-010
 *   node batch-fill.js 5 claim --ai       # Creates 5 forms with AI-generated descriptions
 */

const { fillForm } = require('./fill-form');
const { createGroqCallback } = require('./ai-integration');

async function batchFill(count, prefix = 'claim', options = {}) {
  console.log(`\n=== Batch Form Filler ===`);
  console.log(`Generating ${count} forms with prefix: ${prefix}`);
  if (options.useAI) {
    console.log(`AI Mode: Enabled (Groq)`);
  }
  console.log('');

  const results = [];
  const startTime = Date.now();

  // Create AI callback if enabled
  let aiCallback = null;
  if (options.useAI) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('Error: GROQ_API_KEY environment variable is required for AI mode');
      process.exit(1);
    }
    aiCallback = createGroqCallback(apiKey);
  }

  for (let i = 1; i <= count; i++) {
    const runId = `${prefix}-${String(i).padStart(3, '0')}`;
    console.log(`[${i}/${count}] Processing ${runId}...`);

    // Reset AI cache for each new form
    if (aiCallback && aiCallback.resetCache) {
      aiCallback.resetCache();
    }

    try {
      const result = await fillForm(runId, {
        silent: true,
        ai: options.useAI,
        aiCallback: aiCallback,
      });
      results.push({
        runId,
        success: true,
        outputPath: result.outputPath,
        claimant: result.data.claimant.fullName,
        employer: result.data.employer.name,
      });
    } catch (err) {
      results.push({
        runId,
        success: false,
        error: err.message,
      });
      console.error(`  Error: ${err.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n=== Batch Complete ===`);
  console.log(`  Total: ${count} forms`);
  console.log(`  Success: ${results.filter(r => r.success).length}`);
  console.log(`  Failed: ${results.filter(r => !r.success).length}`);
  console.log(`  Time: ${elapsed}s`);

  console.log(`\n=== Generated Claims ===\n`);
  results.filter(r => r.success).forEach(r => {
    console.log(`  ${r.runId}: ${r.claimant} @ ${r.employer}`);
  });

  if (results.some(r => !r.success)) {
    console.log(`\n=== Failed ===\n`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ${r.runId}: ${r.error}`);
    });
  }

  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Batch Form Filler

Usage:
  node batch-fill.js <count> [prefix] [--ai]

Arguments:
  count     Number of forms to generate
  prefix    Run ID prefix (default: "claim")

Options:
  --ai      Enable AI-generated disability descriptions (requires GROQ_API_KEY)

Examples:
  node batch-fill.js 5
  node batch-fill.js 10 employee
  node batch-fill.js 5 claim --ai
    `);
    process.exit(0);
  }

  const useAI = args.includes('--ai');
  const nonFlagArgs = args.filter(a => !a.startsWith('--'));

  const count = parseInt(nonFlagArgs[0], 10);
  const prefix = nonFlagArgs[1] || 'claim';

  if (isNaN(count) || count < 1) {
    console.error('Error: count must be a positive number');
    process.exit(1);
  }

  await batchFill(count, prefix, { useAI });
}

module.exports = { batchFill };

if (require.main === module) {
  main().catch(console.error);
}
