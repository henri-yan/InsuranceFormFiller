const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function findYesNoFields() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  // Get all field names
  const allNames = fields.map(f => f.getName());

  // Look for potential Yes/No patterns
  console.log('=== Looking for Yes/No field patterns ===\n');

  // Group by prefix number
  const byPrefix = {};
  fields.forEach(f => {
    const name = f.getName();
    const match = name.match(/^(\d+)/);
    if (match) {
      const prefix = match[1];
      if (!byPrefix[prefix]) byPrefix[prefix] = [];
      byPrefix[prefix].push({
        name,
        type: f.constructor.name.replace('PDF', '')
      });
    }
  });

  // Show prefixes with multiple fields (potential Yes/No pairs)
  console.log('Prefixes with checkboxes:\n');
  Object.keys(byPrefix).sort((a, b) => parseInt(a) - parseInt(b)).forEach(prefix => {
    const hasCheckbox = byPrefix[prefix].some(f => f.type === 'CheckBox');
    if (hasCheckbox) {
      console.log(`Prefix ${prefix}:`);
      byPrefix[prefix].forEach(f => {
        console.log(`  [${f.type}] ${f.name}`);
      });
      console.log('');
    }
  });

  // Check raw acroform for any hidden fields
  const acroForm = pdfDoc.catalog.lookup(pdfDoc.catalog.get('AcroForm'));
  if (acroForm) {
    const fieldsArray = acroForm.get('Fields');
    console.log(`\nTotal AcroForm fields: ${fieldsArray?.size() || 'unknown'}`);
  }

  // Look for fields that might be Yes/No but named differently
  console.log('\n=== Fields with Yes/No related names ===\n');
  fields.forEach(f => {
    const name = f.getName();
    const lower = name.toLowerCase();
    if (lower.includes('yes') || lower.includes('_y') || lower.includes('_n') ||
        lower.match(/\bno\b/) || name.includes('Yes') || name.includes('No')) {
      console.log(`[${f.constructor.name.replace('PDF', '')}] ${name}`);
    }
  });
}

findYesNoFields().catch(console.error);
