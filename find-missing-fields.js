const fs = require('fs');
const { PDFDocument, PDFName } = require('pdf-lib');

async function findFields() {
  const pdfBytes = fs.readFileSync('./DBLNYC84.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('=== Looking for received/claimed fields ===\n');
  fields.forEach(f => {
    const name = f.getName().toLowerCase();
    if (name.includes('receiv') || name.includes('claim') || name.includes('9 -')) {
      const type = f.constructor.name.replace('PDF', '');
      console.log(`[${type}] ${f.getName()}`);
    }
  });

  console.log('\n=== Looking for 52 weeks / leave / disability / PFL fields ===\n');
  fields.forEach(f => {
    const name = f.getName().toLowerCase();
    if (name.includes('52') || name.includes('week') || name.includes('leave') ||
        name.includes('preceding') || name.includes('47 -') || name.includes('48 -') ||
        name.includes('49 -')) {
      const type = f.constructor.name.replace('PDF', '');
      console.log(`[${type}] ${f.getName()}`);
    }
  });

  // Check field 47 specifically - it has 4 widgets
  console.log('\n=== Examining field 47 structure ===\n');
  const field47 = form.getCheckBox('47 - In the preceding 52 weeks has the employee taken leave for:');
  const acroField = field47.acroField;
  const widgets = acroField.getWidgets();

  console.log(`Field: 47 - In the preceding 52 weeks...`);
  console.log(`Widget count: ${widgets.length}`);

  widgets.forEach((widget, i) => {
    const ap = widget.dict.get(PDFName.of('AP'));
    if (ap) {
      const apDict = pdfDoc.context.lookup(ap);
      const normal = apDict?.get(PDFName.of('N'));
      if (normal) {
        const normalDict = pdfDoc.context.lookup(normal);
        if (normalDict) {
          const states = normalDict.entries().map(([k]) => k.toString()).filter(s => s !== '/Off');
          const rect = widget.getRectangle();
          console.log(`  Widget ${i}: states=${states.join(',')}, pos=(${rect.x.toFixed(0)}, ${rect.y.toFixed(0)})`);
        }
      }
    }
  });

  // Check field 9 - received/claimed
  console.log('\n=== Examining field 9 structure ===\n');
  const field9 = form.getCheckBox('9 - If yes is checked');
  const acroField9 = field9.acroField;
  const widgets9 = acroField9.getWidgets();

  console.log(`Field: 9 - If yes is checked`);
  console.log(`Widget count: ${widgets9.length}`);

  widgets9.forEach((widget, i) => {
    const ap = widget.dict.get(PDFName.of('AP'));
    if (ap) {
      const apDict = pdfDoc.context.lookup(ap);
      const normal = apDict?.get(PDFName.of('N'));
      if (normal) {
        const normalDict = pdfDoc.context.lookup(normal);
        if (normalDict) {
          const states = normalDict.entries().map(([k]) => k.toString()).filter(s => s !== '/Off');
          const rect = widget.getRectangle();
          console.log(`  Widget ${i}: states=${states.join(',')}, pos=(${rect.x.toFixed(0)}, ${rect.y.toFixed(0)})`);
        }
      }
    }
  });
}

findFields().catch(console.error);
