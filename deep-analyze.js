const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function deepAnalyze() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  // Look for Yes/No patterns
  console.log('=== LOOKING FOR YES/NO CHECKBOX PAIRS ===\n');

  const yesNoKeywords = ['yes', 'no', 'work', 'recover', 'wage', 'union', 'unemploy',
                          'disability', 'compensation', 'fault', 'injury', 'social security',
                          'pfl', 'family leave', 'reimburse', 'continued'];

  const checkboxes = fields.filter(f => f.constructor.name === 'PDFCheckBox');

  console.log(`Total checkboxes: ${checkboxes.length}\n`);

  checkboxes.forEach((cb, i) => {
    const name = cb.getName();
    const nameLower = name.toLowerCase();

    // Check if this looks like a Yes/No question
    const matchedKeyword = yesNoKeywords.find(k => nameLower.includes(k));
    if (matchedKeyword) {
      console.log(`[${i+1}] "${name}"`);
      console.log(`    Keyword: ${matchedKeyword}`);
    }
  });

  // Look for any fields containing "yes" or "no" explicitly
  console.log('\n=== FIELDS WITH "YES" OR "NO" IN NAME ===\n');
  fields.forEach(f => {
    const name = f.getName().toLowerCase();
    if (name.includes('yes') || name.includes(' no')) {
      console.log(`[${f.constructor.name}] ${f.getName()}`);
    }
  });

  // Look for fields that might be part of Yes/No pairs by number
  console.log('\n=== CHECKBOXES BY NUMBER (looking for pairs) ===\n');
  const cbByPrefix = {};
  checkboxes.forEach(cb => {
    const name = cb.getName();
    const match = name.match(/^(\d+)/);
    if (match) {
      const prefix = match[1];
      if (!cbByPrefix[prefix]) cbByPrefix[prefix] = [];
      cbByPrefix[prefix].push(name);
    }
  });

  Object.keys(cbByPrefix).sort((a,b) => parseInt(a) - parseInt(b)).forEach(prefix => {
    if (cbByPrefix[prefix].length > 0) {
      console.log(`Prefix ${prefix}: ${cbByPrefix[prefix].length} checkbox(es)`);
      cbByPrefix[prefix].forEach(n => console.log(`  - ${n}`));
    }
  });

  // List all fields with their widget annotations to find hidden checkboxes
  console.log('\n=== LOOKING FOR RADIO GROUPS ===\n');
  const radioGroups = fields.filter(f => f.constructor.name === 'PDFRadioGroup');
  console.log(`Radio groups found: ${radioGroups.length}`);
  radioGroups.forEach(rg => {
    console.log(`  ${rg.getName()}: ${rg.getOptions()}`);
  });

  // Check for fields in specific ranges that might be missing
  console.log('\n=== FIELDS IN "BLANK" RANGES ===\n');

  // Did you work that day - should be around field 25-26
  console.log('Around "Did you work that day" (24-26):');
  fields.filter(f => {
    const match = f.getName().match(/^(2[4-6]) /);
    return match;
  }).forEach(f => console.log(`  [${f.constructor.name}] ${f.getName()}`));

  // Have you recovered - should be around 27-28
  console.log('\nAround "Have you recovered" (27-28):');
  fields.filter(f => {
    const match = f.getName().match(/^(2[7-8]) /);
    return match;
  }).forEach(f => console.log(`  [${f.constructor.name}] ${f.getName()}`));

  // Workers comp area
  console.log('\nAround workers comp/no-fault (5-8):');
  fields.filter(f => {
    const match = f.getName().match(/^([5-8]) /);
    return match;
  }).forEach(f => console.log(`  [${f.constructor.name}] ${f.getName()}`));
}

deepAnalyze().catch(console.error);
