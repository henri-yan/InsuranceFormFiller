const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzeFormFields() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`Total pages: ${pdfDoc.getPageCount()}`);
  console.log(`Total fields: ${fields.length}\n`);

  // Group fields by their prefix number
  const byPrefix = {};
  const noPrefix = [];

  fields.forEach(field => {
    const name = field.getName();
    const type = field.constructor.name;
    const match = name.match(/^(\d+)/);

    if (match) {
      const prefix = match[1];
      if (!byPrefix[prefix]) byPrefix[prefix] = [];
      byPrefix[prefix].push({ name, type });
    } else {
      noPrefix.push({ name, type });
    }
  });

  // Print organized by prefix
  console.log('=== FIELDS BY NUMBER PREFIX ===\n');
  Object.keys(byPrefix).sort((a, b) => parseInt(a) - parseInt(b)).forEach(prefix => {
    console.log(`--- Prefix ${prefix} (${byPrefix[prefix].length} fields) ---`);
    byPrefix[prefix].forEach(f => {
      console.log(`  [${f.type.replace('PDF', '')}] ${f.name}`);
    });
    console.log('');
  });

  if (noPrefix.length > 0) {
    console.log('--- No Number Prefix ---');
    noPrefix.forEach(f => {
      console.log(`  [${f.type.replace('PDF', '')}] ${f.name}`);
    });
  }

  // Look for Part B specific keywords
  console.log('\n=== SEARCHING FOR PART B KEYWORDS ===\n');
  const partBKeywords = [
    'diagnosis', 'symptom', 'finding', 'hospital', 'operation',
    'treatment', 'provider', 'physician', 'license', 'certified',
    'pregnancy', 'delivery', 'medical'
  ];

  fields.forEach(field => {
    const name = field.getName().toLowerCase();
    partBKeywords.forEach(keyword => {
      if (name.includes(keyword)) {
        console.log(`Found "${keyword}": ${field.getName()}`);
      }
    });
  });

  // Check for fields that might be Part B based on context
  console.log('\n=== POSSIBLE PART B FIELDS (by name analysis) ===\n');
  const possiblePartB = fields.filter(f => {
    const name = f.getName().toLowerCase();
    return name.includes('gender') ||
           name.includes('diagnosis') ||
           name.includes('symptom') ||
           name.includes('finding') ||
           name.includes('hospital') ||
           name.includes('operation') ||
           name.includes('treatment') ||
           name.includes('provider') ||
           name.includes('license') ||
           name.includes('certified') ||
           name.includes('pregnancy') ||
           name.includes('birth') ||
           (name.includes('first name') && !name.includes('claimant')) ||
           (name.includes('last name') && !name.includes('claimant'));
  });

  if (possiblePartB.length > 0) {
    possiblePartB.forEach(f => {
      console.log(`  [${f.constructor.name.replace('PDF', '')}] ${f.getName()}`);
    });
  } else {
    console.log('  No obvious Part B fields found!');
  }

  // List all checkboxes
  console.log('\n=== ALL CHECKBOXES ===\n');
  const checkboxes = fields.filter(f => f.constructor.name === 'PDFCheckBox');
  checkboxes.forEach(f => {
    console.log(`  ${f.getName()}`);
  });

  // Summary
  console.log('\n=== SUMMARY ===\n');
  const textFields = fields.filter(f => f.constructor.name === 'PDFTextField').length;
  const checkboxFields = fields.filter(f => f.constructor.name === 'PDFCheckBox').length;
  const dropdowns = fields.filter(f => f.constructor.name === 'PDFDropdown').length;
  const radioGroups = fields.filter(f => f.constructor.name === 'PDFRadioGroup').length;

  console.log(`Text Fields: ${textFields}`);
  console.log(`Checkboxes: ${checkboxFields}`);
  console.log(`Dropdowns: ${dropdowns}`);
  console.log(`Radio Groups: ${radioGroups}`);

  // Check what field mapping is missing
  const { FieldMappings } = require('./field-mapping');
  const mappedFields = new Set(Object.keys(FieldMappings));
  const extractedFields = new Set(fields.map(f => f.getName()));

  const unmapped = [...extractedFields].filter(f => !mappedFields.has(f));
  const missingFromPdf = [...mappedFields].filter(f => !extractedFields.has(f));

  console.log(`\nMapped fields: ${mappedFields.size}`);
  console.log(`Extracted fields: ${extractedFields.size}`);

  if (unmapped.length > 0) {
    console.log(`\n=== UNMAPPED FIELDS (in PDF but not in mapping) ===\n`);
    unmapped.forEach(f => console.log(`  ${f}`));
  }

  if (missingFromPdf.length > 0) {
    console.log(`\n=== MISSING FROM PDF (in mapping but not in PDF) ===\n`);
    missingFromPdf.forEach(f => console.log(`  ${f}`));
  }
}

analyzeFormFields().catch(console.error);
