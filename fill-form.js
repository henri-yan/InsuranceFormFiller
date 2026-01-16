/**
 * PDF Form Filler for NY DBL Form (DB-450)
 *
 * Usage:
 *   node fill-form.js <run-id> [options]
 *
 * Options:
 *   --output, -o <path>    Output PDF path (default: ./output/<run-id>.pdf)
 *   --ai                   Enable AI generation for descriptions
 *   --flatten              Flatten form after filling (makes fields non-editable)
 *   --preview              Preview field values without creating PDF
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName } = require('pdf-lib');
const { DataGenerator } = require('./data-generator');
const { FieldMappings, AIFields } = require('./field-mapping');

/**
 * Get the on-values for each widget in a checkbox field.
 * Returns an array of { widget: index, value: string } for each non-Off appearance state.
 * Used to detect yes/no checkbox pairs.
 */
function getCheckboxOnValues(checkBox, pdfDoc) {
  const acroField = checkBox.acroField;
  const widgets = acroField.getWidgets();
  const onValues = [];

  widgets.forEach((widget, i) => {
    const ap = widget.dict.get(PDFName.of('AP'));
    if (ap) {
      const apDict = pdfDoc.context.lookup(ap);
      const normal = apDict?.get(PDFName.of('N'));
      if (normal) {
        const normalDict = pdfDoc.context.lookup(normal);
        if (normalDict) {
          normalDict.entries().forEach(([k]) => {
            const keyStr = k.toString();
            if (keyStr !== '/Off') {
              onValues.push({ widget: i, value: keyStr.slice(1) }); // Remove leading /
            }
          });
        }
      }
    }
  });

  return onValues;
}

/**
 * Check if a checkbox is a yes/no pair (has separate Yes and No widgets).
 */
function isYesNoCheckbox(onValues) {
  const hasYes = onValues.some(v => v.value === 'Yes');
  const hasNo = onValues.some(v => v.value === 'No');
  return hasYes && hasNo;
}

/**
 * Check if a checkbox is a multi-widget checkbox (more than one distinct on-value).
 */
function isMultiWidgetCheckbox(onValues) {
  return onValues.length > 1;
}

/**
 * Set the value of a multi-widget checkbox directly using dict manipulation.
 * This handles yes/no pairs, received/claimed, and other multi-option checkboxes.
 *
 * @param {PDFCheckBox} checkBox - The checkbox field
 * @param {PDFDocument} pdfDoc - The PDF document
 * @param {string} targetValue - The value to select (e.g., 'Yes', 'No', 'Received', 'None')
 * @param {Array} onValues - Array of {widget, value} for each widget's on-state
 */
function setMultiWidgetCheckboxValue(checkBox, pdfDoc, targetValue, onValues) {
  const acroField = checkBox.acroField;
  const widgets = acroField.getWidgets();

  // Set the field value
  acroField.dict.set(PDFName.of('V'), PDFName.of(targetValue));

  // Set AS (appearance state) on each widget
  widgets.forEach((widget, i) => {
    const widgetOnValue = onValues.find(v => v.widget === i);
    if (widgetOnValue && widgetOnValue.value === targetValue) {
      widget.dict.set(PDFName.of('AS'), PDFName.of(targetValue));
    } else {
      widget.dict.set(PDFName.of('AS'), PDFName.of('Off'));
    }
  });
}

async function fillForm(runId, options = {}) {
  const log = options.silent ? () => {} : console.log.bind(console);

  log('\n=== NY DBL Form Filler ===\n');
  log(`Run ID: ${runId}`);

  // Initialize data generator
  const generator = new DataGenerator(runId, {
    useAI: options.ai || false,
    aiCallback: options.aiCallback || null,
    silent: options.silent || false,
  });

  const data = generator.getData();

  // Load PDF
  const pdfPath = options.input || './DBLNYC84.pdf';
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Track filled fields for reporting
  const filledFields = [];
  const skippedFields = [];
  const errors = [];

  // Get all form fields
  const fields = form.getFields();
  log(`\nProcessing ${fields.length} form fields...\n`);

  for (const field of fields) {
    const fieldName = field.getName();
    const fieldType = field.constructor.name;
    const mapping = FieldMappings[fieldName];

    if (!mapping) {
      skippedFields.push({ name: fieldName, reason: 'No mapping defined' });
      continue;
    }

    try {
      let value;

      switch (mapping.type) {
        case 'faker':
          value = generator.getFakerValue(mapping.method, mapping.args || []);
          break;

        case 'calculated':
          value = generator.getCalculatedValue(mapping.generator, mapping.args || []);
          break;

        case 'ai':
          value = await generator.getAIValue(fieldName, mapping.prompt, mapping.category);
          break;

        case 'static':
          value = mapping.value;
          break;

        case 'checkbox':
          value = generator.getCheckboxValue(fieldName, mapping.probability);
          break;

        case 'checkbox-multi':
          // Multi-option checkbox - get specific value from generator
          value = generator.getCalculatedValue(mapping.generator, mapping.args || []);
          break;

        default:
          skippedFields.push({ name: fieldName, reason: `Unknown mapping type: ${mapping.type}` });
          continue;
      }

      // Apply value to field
      if (fieldType === 'PDFTextField') {
        const textField = form.getTextField(fieldName);
        if (value !== undefined && value !== null && value !== '') {
          textField.setText(String(value));
          filledFields.push({ name: fieldName, value: String(value).substring(0, 50), type: mapping.type });
        }
      } else if (fieldType === 'PDFCheckBox') {
        const checkBox = form.getCheckBox(fieldName);
        const onValues = getCheckboxOnValues(checkBox, pdfDoc);

        if (mapping.type === 'checkbox-multi') {
          // Multi-option checkbox with explicit value selection
          const targetValue = typeof value === 'function' ? value() : value;
          if (targetValue) {
            setMultiWidgetCheckboxValue(checkBox, pdfDoc, targetValue, onValues);
            filledFields.push({ name: fieldName, value: targetValue, type: 'checkbox-multi' });
          }
        } else if (isYesNoCheckbox(onValues)) {
          // Yes/No checkbox pair - convert boolean to Yes/No
          const targetValue = value ? 'Yes' : 'No';
          setMultiWidgetCheckboxValue(checkBox, pdfDoc, targetValue, onValues);
          filledFields.push({ name: fieldName, value: targetValue, type: 'checkbox-yesno' });
        } else if (isMultiWidgetCheckbox(onValues)) {
          // Other multi-widget checkbox - need explicit value from mapping
          // If boolean true, use first on-value; if false, use 'Off'
          if (value === true && onValues.length > 0) {
            const targetValue = onValues[0].value;
            setMultiWidgetCheckboxValue(checkBox, pdfDoc, targetValue, onValues);
            filledFields.push({ name: fieldName, value: targetValue, type: 'checkbox-multi' });
          } else if (typeof value === 'string') {
            setMultiWidgetCheckboxValue(checkBox, pdfDoc, value, onValues);
            filledFields.push({ name: fieldName, value: value, type: 'checkbox-multi' });
          } else {
            checkBox.uncheck();
            filledFields.push({ name: fieldName, value: 'unchecked', type: 'checkbox' });
          }
        } else {
          // Single-tick checkbox - use standard check/uncheck
          if (value === true) {
            checkBox.check();
          } else {
            checkBox.uncheck();
          }
          filledFields.push({ name: fieldName, value: value ? 'checked' : 'unchecked', type: 'checkbox' });
        }
      } else if (fieldType === 'PDFDropdown') {
        const dropdown = form.getDropdown(fieldName);
        if (value) {
          dropdown.select(value);
          filledFields.push({ name: fieldName, value, type: 'dropdown' });
        }
      } else if (fieldType === 'PDFRadioGroup') {
        const radioGroup = form.getRadioGroup(fieldName);
        if (value) {
          radioGroup.select(value);
          filledFields.push({ name: fieldName, value, type: 'radio' });
        }
      }

    } catch (err) {
      errors.push({ name: fieldName, error: err.message });
    }
  }

  // Preview mode - just print values
  if (options.preview) {
    log('\n=== PREVIEW MODE ===\n');
    log('Generated Data Summary:');
    log(`  Claimant: ${data.claimant.fullName}`);
    log(`  SSN: ${data.claimant.ssn.full}`);
    log(`  DOB: ${generator.formatDate(data.claimant.dateOfBirth).full}`);
    log(`  Employer: ${data.employer.name}`);
    log(`  Disability Start: ${generator.formatDate(data.dates.disabilityStart).full}`);
    log(`  Avg Weekly Wage: $${data.wages.averageWeeklyWage.toFixed(2)}`);

    log('\n=== Filled Fields ===\n');
    filledFields.forEach(f => {
      log(`  [${f.type}] ${f.name}: ${f.value}`);
    });

    if (skippedFields.length > 0) {
      log('\n=== Skipped Fields ===\n');
      skippedFields.forEach(f => {
        log(`  ${f.name}: ${f.reason}`);
      });
    }

    if (errors.length > 0) {
      log('\n=== Errors ===\n');
      errors.forEach(e => {
        log(`  ${e.name}: ${e.error}`);
      });
    }

    return { data, filledFields, skippedFields, errors };
  }

  // Flatten form if requested
  if (options.flatten) {
    form.flatten();
    log('Form flattened (fields are now non-editable)');
  }

  // Save PDF
  const outputDir = options.outputDir || './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = options.output || path.join(outputDir, `${runId}.pdf`);
  const filledPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, filledPdfBytes);

  log(`\n=== Summary ===`);
  log(`  Fields filled: ${filledFields.length}`);
  log(`  Fields skipped: ${skippedFields.length}`);
  log(`  Errors: ${errors.length}`);
  log(`\n  Output saved to: ${outputPath}`);

  // Save a report
  const reportPath = path.join(outputDir, `${runId}-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    runId,
    generatedAt: new Date().toISOString(),
    claimant: data.claimant.fullName,
    employer: data.employer.name,
    filledFields: filledFields.length,
    skippedFields: skippedFields.length,
    errors: errors.length,
    outputPath,
  }, null, 2));

  log(`  Report saved to: ${reportPath}\n`);

  return { data, filledFields, skippedFields, errors, outputPath };
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
NY DBL Form Filler

Usage:
  node fill-form.js <run-id> [options]

Arguments:
  run-id              Unique identifier for this run (used for data persistence)

Options:
  --output, -o <path>  Output PDF path (default: ./output/<run-id>.pdf)
  --ai                 Enable AI generation for descriptions (requires callback)
  --flatten            Flatten form after filling
  --preview            Preview field values without creating PDF
  --help, -h           Show this help message

Examples:
  node fill-form.js claim-001
  node fill-form.js claim-002 --preview
  node fill-form.js claim-003 --output ./filled-forms/claim-003.pdf --flatten
    `);
    process.exit(0);
  }

  const runId = args[0];
  const options = {
    preview: args.includes('--preview'),
    flatten: args.includes('--flatten'),
    ai: args.includes('--ai'),
  };

  // Parse output path
  const outputIndex = args.findIndex(a => a === '--output' || a === '-o');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  try {
    await fillForm(runId, options);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { fillForm };

// Run CLI if executed directly
if (require.main === module) {
  main();
}
