const fs = require('fs');
const { PDFDocument, PDFName, PDFDict, PDFArray } = require('pdf-lib');

async function deepScanPDF() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get the AcroForm
  const acroForm = pdfDoc.catalog.get(PDFName.of('AcroForm'));

  if (!acroForm) {
    console.log('No AcroForm found');
    return;
  }

  const acroFormDict = pdfDoc.context.lookup(acroForm);
  const fieldsRef = acroFormDict.get(PDFName.of('Fields'));
  const fieldsArray = pdfDoc.context.lookup(fieldsRef);

  console.log(`Total top-level fields: ${fieldsArray.size()}\n`);

  // Recursively explore field structure
  function exploreField(fieldRef, depth = 0) {
    const field = pdfDoc.context.lookup(fieldRef);
    if (!field) return;

    const indent = '  '.repeat(depth);

    // Get field properties
    const ftRef = field.get(PDFName.of('FT'));
    const ft = ftRef ? pdfDoc.context.lookup(ftRef)?.toString() || ftRef.toString() : null;

    const tRef = field.get(PDFName.of('T'));
    const t = tRef ? pdfDoc.context.lookup(tRef)?.toString() || tRef.toString() : 'unnamed';

    const vRef = field.get(PDFName.of('V'));
    const v = vRef ? pdfDoc.context.lookup(vRef)?.toString() || vRef.toString() : null;

    // Get kids (child fields/widgets)
    const kidsRef = field.get(PDFName.of('Kids'));

    // Check for widget annotations (Subtype = Widget)
    const subtypeRef = field.get(PDFName.of('Subtype'));
    const subtype = subtypeRef ? subtypeRef.toString() : null;

    // Get appearance state for checkboxes
    const asRef = field.get(PDFName.of('AS'));
    const as = asRef ? asRef.toString() : null;

    if (ft === '/Btn' || subtype === '/Widget') {
      console.log(`${indent}Field: ${t}`);
      console.log(`${indent}  Type: ${ft || 'Widget'}`);
      if (as) console.log(`${indent}  State (AS): ${as}`);
      if (v) console.log(`${indent}  Value (V): ${v}`);

      // Check for Opt (options for checkboxes/radios)
      const optRef = field.get(PDFName.of('Opt'));
      if (optRef) {
        const opt = pdfDoc.context.lookup(optRef);
        console.log(`${indent}  Options: ${opt}`);
      }
    }

    if (kidsRef) {
      const kids = pdfDoc.context.lookup(kidsRef);
      if (kids instanceof PDFArray) {
        const numKids = kids.size();
        if (ft === '/Btn' && numKids > 1) {
          console.log(`${indent}  ** HAS ${numKids} CHILD WIDGETS (likely Yes/No pair) **`);
        }
        for (let i = 0; i < numKids; i++) {
          const kidRef = kids.get(i);
          exploreField(kidRef, depth + 1);
        }
      }
    }
  }

  console.log('=== Scanning for Button fields with multiple widgets ===\n');

  for (let i = 0; i < fieldsArray.size(); i++) {
    const fieldRef = fieldsArray.get(i);
    const field = pdfDoc.context.lookup(fieldRef);

    const ftRef = field.get(PDFName.of('FT'));
    const ft = ftRef ? pdfDoc.context.lookup(ftRef)?.toString() || ftRef.toString() : null;

    // Only show button fields (checkboxes/radios)
    if (ft === '/Btn') {
      exploreField(fieldRef, 0);
      console.log('');
    }
  }

  // Also check using the form API
  console.log('\n=== Using pdf-lib form API ===\n');
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  fields.forEach(f => {
    if (f.constructor.name === 'PDFCheckBox') {
      const name = f.getName();
      const acroField = f.acroField;

      // Check for multiple widgets
      const widgets = acroField.getWidgets();
      if (widgets.length > 1) {
        console.log(`MULTI-WIDGET: ${name} has ${widgets.length} widgets`);
        widgets.forEach((w, i) => {
          const rect = w.getRectangle();
          console.log(`  Widget ${i}: position (${rect.x}, ${rect.y})`);
        });
      }
    }
  });
}

deepScanPDF().catch(console.error);
