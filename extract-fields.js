const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function extractFormFields() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const fieldInfo = fields.map(field => {
    const type = field.constructor.name;
    const name = field.getName();

    let options = null;
    let isChecked = null;

    // Get additional info based on field type
    if (type === 'PDFDropdown') {
      try {
        options = field.getOptions();
      } catch (e) {}
    }
    if (type === 'PDFCheckBox') {
      try {
        isChecked = field.isChecked();
      } catch (e) {}
    }
    if (type === 'PDFRadioGroup') {
      try {
        options = field.getOptions();
      } catch (e) {}
    }

    return {
      name,
      type,
      options,
      isChecked
    };
  });

  // Group by type
  const byType = {};
  fieldInfo.forEach(f => {
    if (!byType[f.type]) byType[f.type] = [];
    byType[f.type].push(f);
  });

  console.log('\n=== FORM FIELD SUMMARY ===\n');
  Object.keys(byType).forEach(type => {
    console.log(`${type}: ${byType[type].length} fields`);
  });

  console.log('\n=== ALL FIELDS ===\n');
  fieldInfo.forEach((f, i) => {
    console.log(`${i + 1}. [${f.type}] ${f.name}`);
    if (f.options) console.log(`   Options: ${JSON.stringify(f.options)}`);
    if (f.isChecked !== null) console.log(`   Checked: ${f.isChecked}`);
  });

  // Save to JSON for reference
  fs.writeFileSync('./form-fields.json', JSON.stringify(fieldInfo, null, 2));
  console.log('\nField info saved to form-fields.json');
}

extractFormFields().catch(console.error);
