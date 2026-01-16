/**
 * NY DBL Form Filler - Interactive Entry Point
 *
 * Prompts user for number of forms to generate and creates filled PDFs.
 */

require('dotenv').config();
const readline = require('readline');
const { batchFill } = require('./batch-fill');

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     NY DBL Form Filler (DB-450)        ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Prompt for number of forms
  const countInput = await prompt('How many PDFs would you like to generate? ');
  const count = parseInt(countInput, 10);

  if (isNaN(count) || count < 1) {
    console.error('\nError: Please enter a valid positive number.');
    process.exit(1);
  }

  if (count > 100) {
    const confirm = await prompt(`\nYou requested ${count} forms. This may take a while. Continue? (y/n) `);
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // Prompt for optional prefix
  const prefixInput = await prompt('Enter a prefix for run IDs (default: "claim"): ');
  const prefix = prefixInput || 'claim';

  // Prompt for AI mode
  let useAI = false;
  const aiInput = await prompt('Use AI for disability descriptions? (y/n, default: n): ');
  if (aiInput.toLowerCase() === 'y' || aiInput.toLowerCase() === 'yes') {
    if (!process.env.GROQ_API_KEY) {
      console.error('\nError: GROQ_API_KEY environment variable is required for AI mode.');
      console.log('Set it with: export GROQ_API_KEY=your_api_key\n');
      process.exit(1);
    }
    useAI = true;
    console.log('\nAI Mode enabled - using Groq for disability descriptions');
  }

  console.log('');

  // Run batch fill
  await batchFill(count, prefix, { useAI });

  console.log('\nAll forms saved to ./output/');
  console.log('Data files saved to ./generated-data/\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
