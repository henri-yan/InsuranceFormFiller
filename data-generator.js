/**
 * Data Generator Module
 * Generates persistent fake data for form filling using seeded faker
 */

const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { SampleDisabilityDescriptions } = require('./field-mapping');

class DataGenerator {
  constructor(runId, options = {}) {
    this.runId = runId;
    this.seed = this.hashString(runId);
    this.dataDir = options.dataDir || './generated-data';
    this.useAI = options.useAI || false;
    this.aiCallback = options.aiCallback || null;
    this.silent = options.silent || false;
    this.log = this.silent ? () => {} : console.log.bind(console);

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.dataFile = path.join(this.dataDir, `${runId}.json`);

    // Load existing data or generate new
    if (fs.existsSync(this.dataFile)) {
      this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
      this.log(`Loaded existing data for run: ${runId}`);
    } else {
      faker.seed(this.seed);
      this.data = this.generateBaseData();
      this.saveData();
      this.log(`Generated new data for run: ${runId} (seed: ${this.seed})`);
    }
  }

  // Simple string hash for seeding
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Generate all base data upfront for consistency
  generateBaseData() {
    const now = new Date();

    // Calculate key dates
    const disabilityStartDate = new Date(now);
    disabilityStartDate.setDate(disabilityStartDate.getDate() - faker.number.int({ min: 7, max: 21 }));

    const lastDayWorked = new Date(disabilityStartDate);
    lastDayWorked.setDate(lastDayWorked.getDate() - 1);

    const employmentStartDate = new Date(lastDayWorked);
    employmentStartDate.setFullYear(employmentStartDate.getFullYear() - faker.number.int({ min: 1, max: 10 }));

    const dateOfBirth = faker.date.birthdate({ min: 25, max: 60, mode: 'age' });

    // Base weekly wage for calculations
    const baseWeeklyWage = faker.number.float({ min: 800, max: 2500, fractionDigits: 2 });

    // Generate weekly wage data for 8 weeks
    const weeklyWages = [];
    for (let i = 1; i <= 8; i++) {
      const weekEndDate = new Date(lastDayWorked);
      weekEndDate.setDate(weekEndDate.getDate() - (7 * (i - 1)));

      const daysWorked = faker.number.int({ min: 4, max: 5 });
      const wage = baseWeeklyWage + faker.number.float({ min: -100, max: 100, fractionDigits: 2 });

      weeklyWages.push({
        weekNumber: i,
        weekEndDate: weekEndDate.toISOString(),
        daysWorked,
        grossAmount: Math.round(wage * 100) / 100
      });
    }

    const averageWeeklyWage = weeklyWages.reduce((sum, w) => sum + w.grossAmount, 0) / 8;

    // Select a disability description
    const disabilityIndex = faker.number.int({ min: 0, max: SampleDisabilityDescriptions.length - 1 });
    const disabilityDescription = SampleDisabilityDescriptions[disabilityIndex];

    // Generate claimant info
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const middleInitial = faker.string.alpha({ length: 1, casing: 'upper' });

    // Generate employer info
    const employerName = faker.company.name();
    const employerContactName = faker.person.fullName();
    const employerContactTitle = faker.person.jobTitle();
    const employerPhone = faker.phone.number('(###) ###-####');
    const employerEmail = faker.internet.email();

    // Generate SSN parts
    const ssn1 = faker.string.numeric(3);
    const ssn2 = faker.string.numeric(2);
    const ssn3 = faker.string.numeric(4);

    // Checkbox states (seeded random) - realistic probabilities
    const checkboxStates = {
      gender: faker.datatype.boolean(),
      didWorkOnDisabilityDay: faker.datatype.boolean({ probability: 0.3 }),
      hasRecovered: faker.datatype.boolean({ probability: 0.2 }),
      workedForWages: faker.datatype.boolean({ probability: 0.1 }),
      unionMember: faker.datatype.boolean({ probability: 0.15 }),
      // Item 13 - usually "No" for most benefits
      receivingWages: faker.datatype.boolean({ probability: 0.3 }),
      unemploymentBenefits: faker.datatype.boolean({ probability: 0.1 }),
      paidFamilyLeave: faker.datatype.boolean({ probability: 0.1 }),
      workersComp: faker.datatype.boolean({ probability: 0.05 }),
      noFaultAccident: faker.datatype.boolean({ probability: 0.08 }),
      thirdPartyInjury: faker.datatype.boolean({ probability: 0.05 }),
      longTermDisability: faker.datatype.boolean({ probability: 0.05 }),
      // Item 14 & 15 - prior benefits
      priorDisability: faker.datatype.boolean({ probability: 0.15 }),
      priorPFL: faker.datatype.boolean({ probability: 0.1 }),
      // Item 16 - employer provided rights
      employerProvidedRights: faker.datatype.boolean({ probability: 0.9 }),
      // Employer section
      wagesContinued: faker.datatype.boolean({ probability: 0.3 }),
      reimbursementRequested: faker.datatype.boolean({ probability: 0.2 }),
      stillEmployed: faker.datatype.boolean({ probability: 0.85 }),
      priorLeave: faker.datatype.boolean({ probability: 0.1 }),
      // Supplement
      directDeposit: faker.datatype.boolean({ probability: 0.7 }),
      employeeContributes: faker.datatype.boolean({ probability: 0.6 }),
      checkingAccount: faker.datatype.boolean({ probability: 0.8 }),
      noEOBs: faker.datatype.boolean({ probability: 0.3 }),
    };

    // Generate prior benefit dates if applicable
    const priorBenefitStart = new Date(disabilityStartDate);
    priorBenefitStart.setMonth(priorBenefitStart.getMonth() - faker.number.int({ min: 6, max: 10 }));
    const priorBenefitEnd = new Date(priorBenefitStart);
    priorBenefitEnd.setDate(priorBenefitEnd.getDate() + faker.number.int({ min: 14, max: 60 }));

    return {
      runId: this.runId,
      generatedAt: new Date().toISOString(),
      seed: this.seed,

      // Claimant Personal Info
      claimant: {
        firstName,
        lastName,
        middleInitial,
        fullName: `${firstName} ${middleInitial}. ${lastName}`,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: 'NY',
        zip: faker.location.zipCode('#####'),
        phone: faker.phone.number('###-###-####'),
        email: faker.internet.email({ firstName, lastName }),
        ssn: { part1: ssn1, part2: ssn2, part3: ssn3, full: `${ssn1}-${ssn2}-${ssn3}` },
        dateOfBirth: dateOfBirth.toISOString(),
        occupation: faker.person.jobTitle(),
      },

      // Dates
      dates: {
        disabilityStart: disabilityStartDate.toISOString(),
        lastDayWorked: lastDayWorked.toISOString(),
        employmentStart: employmentStartDate.toISOString(),
        signatureDate: now.toISOString(),
      },

      // Employer Info
      employer: {
        name: employerName,
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        state: 'NY',
        zip: faker.location.zipCode('#####'),
        phone: employerPhone,
        fein: { part1: faker.string.numeric(2), part2: faker.string.numeric(7) },
        contactName: employerContactName,
        contactTitle: employerContactTitle,
        contactEmail: employerEmail,
        contactPhone: employerPhone,
        policyNumber: faker.string.alphanumeric(8).toUpperCase(),
      },

      // Wages
      wages: {
        weeklyWages,
        averageWeeklyWage: Math.round(averageWeeklyWage * 100) / 100,
        baseWeeklyWage,
      },

      // Union (if applicable)
      union: checkboxStates.unionMember ? {
        name: `Local ${faker.number.int({ min: 1, max: 999 })} - ${faker.company.buzzNoun()} Workers Union`,
      } : null,

      // Disability Description
      disability: {
        description1: disabilityDescription.line1,
        description2: disabilityDescription.line2,
      },

      // Prior benefits data (for items 13, 14, 15)
      priorBenefits: {
        // Item 13 - if receiving/claiming benefits
        claimedFrom: checkboxStates.receivingWages ? employerName : '',
        claimedPeriodStart: checkboxStates.receivingWages ? priorBenefitStart.toISOString() : null,
        claimedPeriodEnd: checkboxStates.receivingWages ? priorBenefitEnd.toISOString() : null,
        // Item 14 - prior disability
        priorDisabilityPaidBy: checkboxStates.priorDisability ? 'ShelterPoint Life' : '',
        priorDisabilityStart: checkboxStates.priorDisability ? priorBenefitStart.toISOString() : null,
        priorDisabilityEnd: checkboxStates.priorDisability ? priorBenefitEnd.toISOString() : null,
        // Item 15 - prior PFL
        priorPFLPaidBy: checkboxStates.priorPFL ? 'ShelterPoint Life' : '',
        priorPFLStart: checkboxStates.priorPFL ? priorBenefitStart.toISOString() : null,
        priorPFLEnd: checkboxStates.priorPFL ? priorBenefitEnd.toISOString() : null,
      },

      // Conditional field data
      conditionalData: {
        // Return to work date (if recovered)
        returnToWorkDate: checkboxStates.hasRecovered ? now.toISOString() : null,
        // Worked for wages dates
        workedForWagesDates: checkboxStates.workedForWages ? `${faker.date.recent({ days: 7 }).toLocaleDateString('en-US')}` : '',
        // Unemployment explanation (item 12)
        unemploymentExplanation: !checkboxStates.unemploymentBenefits ? 'Did not apply for unemployment benefits as disability began while employed.' : '',
        unemploymentPeriods: checkboxStates.unemploymentBenefits ? `${priorBenefitStart.toLocaleDateString('en-US')} - ${priorBenefitEnd.toLocaleDateString('en-US')}` : '',
        // Wages continued type (Part C)
        wagesContinuedType: checkboxStates.wagesContinued ? faker.helpers.arrayElement(['PTO', 'Sick time', 'Salary continuation']) : '',
        // Prior leave dates (Part C item 9)
        priorDisabilityDates: checkboxStates.priorLeave ? `${priorBenefitStart.toLocaleDateString('en-US')} - ${priorBenefitEnd.toLocaleDateString('en-US')}` : '',
        priorPFLDates: checkboxStates.priorPFL ? `${priorBenefitStart.toLocaleDateString('en-US')} - ${priorBenefitEnd.toLocaleDateString('en-US')}` : '',
      },

      // Checkbox states
      checkboxes: checkboxStates,
    };
  }

  saveData() {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
    this.log(`Data saved to: ${this.dataFile}`);
  }

  // Format date as MM/DD/YYYY
  formatDate(isoDate) {
    const d = new Date(isoDate);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return { month, day, year, full: `${month}/${day}/${year}` };
  }

  // Get a calculated field value
  getCalculatedValue(generator, args = []) {
    const generators = {
      // Date of Birth
      dobMonth: () => this.formatDate(this.data.claimant.dateOfBirth).month,
      dobDay: () => this.formatDate(this.data.claimant.dateOfBirth).day,
      dobYear: () => this.formatDate(this.data.claimant.dateOfBirth).year,

      // Disability Start Date
      disabilityStartMonth: () => this.formatDate(this.data.dates.disabilityStart).month,
      disabilityStartDay: () => this.formatDate(this.data.dates.disabilityStart).day,
      disabilityStartYear: () => this.formatDate(this.data.dates.disabilityStart).year,

      // Return to work (if recovered)
      returnToWorkMonth: () => this.data.checkboxes.hasRecovered ? this.formatDate(new Date().toISOString()).month : '',
      returnToWorkDay: () => this.data.checkboxes.hasRecovered ? this.formatDate(new Date().toISOString()).day : '',
      returnToWorkYear: () => this.data.checkboxes.hasRecovered ? this.formatDate(new Date().toISOString()).year : '',

      // Worked dates
      workedDates: () => '',

      // Employment dates
      employmentStartDate: () => this.formatDate(this.data.dates.employmentStart).full,
      lastDayWorked: () => this.formatDate(this.data.dates.lastDayWorked).full,
      lastDayWorkedFormatted: () => this.formatDate(this.data.dates.lastDayWorked).full,
      hireDate: () => this.formatDate(this.data.dates.employmentStart).full,

      // Week end dates
      weekEndDate: (weekNum) => {
        const week = this.data.wages.weeklyWages.find(w => w.weekNumber === weekNum);
        return week ? this.formatDate(week.weekEndDate).full : '';
      },
      weekEndDateFormatted: (weekNum) => {
        const week = this.data.wages.weeklyWages.find(w => w.weekNumber === weekNum);
        return week ? this.formatDate(week.weekEndDate).full : '';
      },

      // Days worked per week
      daysWorkedWeek: (weekNum) => {
        const week = this.data.wages.weeklyWages.find(w => w.weekNumber === weekNum);
        return week ? String(week.daysWorked) : '';
      },

      // Weekly wages
      weeklyWage: (weekNum) => {
        const week = this.data.wages.weeklyWages.find(w => w.weekNumber === weekNum);
        return week ? week.grossAmount.toFixed(2) : '';
      },
      weeklyWageFormatted: (weekNum) => {
        const week = this.data.wages.weeklyWages.find(w => w.weekNumber === weekNum);
        return week ? week.grossAmount.toFixed(2) : '';
      },

      // Average weekly wage
      averageWeeklyWage: () => this.data.wages.averageWeeklyWage.toFixed(2),
      averageWeeklyWageFormatted: () => this.data.wages.averageWeeklyWage.toFixed(2),

      // Union
      unionName: () => this.data.union ? this.data.union.name : '',
      unionMemberCheckbox: () => this.data.checkboxes.unionMember,

      // Signature dates
      signatureDate: () => this.formatDate(this.data.dates.signatureDate).full,
      employerSignatureDate: () => this.formatDate(this.data.dates.signatureDate).full,
      supplementSignatureDate: () => this.formatDate(this.data.dates.signatureDate).full,
      directDepositSignatureDate: () => this.formatDate(this.data.dates.signatureDate).full,

      // Employer info (used by both Part A and Part C for consistency)
      employerBusinessName: () => this.data.employer.name,
      employerAddress: () => this.data.employer.address,
      employerFullAddress: () => `${this.data.employer.address}, ${this.data.employer.city}, ${this.data.employer.state} ${this.data.employer.zip}`,
      employerCityStateZip: () => `${this.data.employer.city}, ${this.data.employer.state} ${this.data.employer.zip}`,
      employerPhone: () => this.data.employer.phone,
      employerSignatoryNameTitle: () => `${this.data.employer.contactName}, ${this.data.employer.contactTitle}`,
      employerContactPhone: () => this.data.employer.contactPhone,
      employerContactName: () => this.data.employer.contactName,
      employerEmail: () => this.data.employer.contactEmail,
      employerPhoneAreaCode: () => {
        const phone = this.data.employer.contactPhone;
        // Handle formats like "(###) ###-####" or "###-###-####"
        const match = phone.match(/\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/);
        return match ? match[1] : phone.substring(0, 3);
      },
      employerPhoneNumber: () => {
        const phone = this.data.employer.contactPhone;
        const match = phone.match(/\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/);
        return match ? `${match[2]}-${match[3]}` : phone.substring(4);
      },
      employerFEIN1: () => this.data.employer.fein.part1,
      employerFEIN2: () => this.data.employer.fein.part2,
      policyNumber: () => this.data.employer.policyNumber,

      // Prior benefits (Item 13, 14, 15)
      claimedFrom: () => this.data.priorBenefits?.claimedFrom || '',
      claimedPeriodStartMonth: () => this.data.priorBenefits?.claimedPeriodStart ? this.formatDate(this.data.priorBenefits.claimedPeriodStart).month : '',
      claimedPeriodStartDay: () => this.data.priorBenefits?.claimedPeriodStart ? this.formatDate(this.data.priorBenefits.claimedPeriodStart).day : '',
      claimedPeriodStartYear: () => this.data.priorBenefits?.claimedPeriodStart ? this.formatDate(this.data.priorBenefits.claimedPeriodStart).year : '',
      claimedPeriodEndMonth: () => this.data.priorBenefits?.claimedPeriodEnd ? this.formatDate(this.data.priorBenefits.claimedPeriodEnd).month : '',
      claimedPeriodEndDay: () => this.data.priorBenefits?.claimedPeriodEnd ? this.formatDate(this.data.priorBenefits.claimedPeriodEnd).day : '',
      claimedPeriodEndYear: () => this.data.priorBenefits?.claimedPeriodEnd ? this.formatDate(this.data.priorBenefits.claimedPeriodEnd).year : '',
      // Item 14
      priorDisabilityPaidBy: () => this.data.priorBenefits?.priorDisabilityPaidBy || '',
      priorDisabilityStartMonth: () => this.data.priorBenefits?.priorDisabilityStart ? this.formatDate(this.data.priorBenefits.priorDisabilityStart).month : '',
      priorDisabilityStartDay: () => this.data.priorBenefits?.priorDisabilityStart ? this.formatDate(this.data.priorBenefits.priorDisabilityStart).day : '',
      priorDisabilityStartYear: () => this.data.priorBenefits?.priorDisabilityStart ? this.formatDate(this.data.priorBenefits.priorDisabilityStart).year : '',
      priorDisabilityEndMonth: () => this.data.priorBenefits?.priorDisabilityEnd ? this.formatDate(this.data.priorBenefits.priorDisabilityEnd).month : '',
      priorDisabilityEndDay: () => this.data.priorBenefits?.priorDisabilityEnd ? this.formatDate(this.data.priorBenefits.priorDisabilityEnd).day : '',
      priorDisabilityEndYear: () => this.data.priorBenefits?.priorDisabilityEnd ? this.formatDate(this.data.priorBenefits.priorDisabilityEnd).year : '',
      // Item 15
      priorPFLPaidBy: () => this.data.priorBenefits?.priorPFLPaidBy || '',
      priorPFLStartMonth: () => this.data.priorBenefits?.priorPFLStart ? this.formatDate(this.data.priorBenefits.priorPFLStart).month : '',
      priorPFLStartDay: () => this.data.priorBenefits?.priorPFLStart ? this.formatDate(this.data.priorBenefits.priorPFLStart).day : '',
      priorPFLStartYear: () => this.data.priorBenefits?.priorPFLStart ? this.formatDate(this.data.priorBenefits.priorPFLStart).year : '',
      priorPFLEndMonth: () => this.data.priorBenefits?.priorPFLEnd ? this.formatDate(this.data.priorBenefits.priorPFLEnd).month : '',
      priorPFLEndDay: () => this.data.priorBenefits?.priorPFLEnd ? this.formatDate(this.data.priorBenefits.priorPFLEnd).day : '',
      priorPFLEndYear: () => this.data.priorBenefits?.priorPFLEnd ? this.formatDate(this.data.priorBenefits.priorPFLEnd).year : '',

      // Conditional field generators
      workedForWagesDates: () => this.data.conditionalData?.workedForWagesDates || '',
      unemploymentExplanation: () => this.data.conditionalData?.unemploymentExplanation || '',
      unemploymentPeriods: () => this.data.conditionalData?.unemploymentPeriods || '',
      wagesContinuedType: () => this.data.conditionalData?.wagesContinuedType || '',
      priorDisabilityDates: () => this.data.conditionalData?.priorDisabilityDates || '',
      priorPFLDates: () => this.data.conditionalData?.priorPFLDates || '',

      // Multi-option checkbox generators
      // For Item 13 "I have: received/claimed" - depends on whether benefits were actually received
      receivedOrClaimed: () => {
        // Check if any of the "yes" benefits checkboxes are checked
        const cb = this.data.checkboxes;
        const anyBenefitsChecked = cb.receivingWages || cb.unemploymentBenefits ||
          cb.paidFamilyLeave || cb.workersComp || cb.noFaultAccident ||
          cb.thirdPartyInjury || cb.longTermDisability;
        if (!anyBenefitsChecked) return null; // Don't check either if no benefits selected
        // If they checked any benefits, randomly choose received vs claimed
        faker.seed(this.seed + 99999); // Use a consistent seed offset for this field
        return faker.datatype.boolean() ? 'Received' : 'Claimed';
      },

      // For Part C Item 9 "In the preceding 52 weeks has the employee taken leave for:"
      // Options: 'NYS#20Disability' (NYS Disability), 'PFL', 'Both', 'None'
      priorLeaveType: () => {
        const cb = this.data.checkboxes;
        const hadDisability = cb.priorDisability;
        const hadPFL = cb.priorPFL;

        if (hadDisability && hadPFL) return 'Both';
        if (hadDisability) return 'NYS#20Disability';
        if (hadPFL) return 'PFL';
        return 'None';
      },

      // Gender selection - randomly choose Male, Female, or X
      genderSelection: () => {
        faker.seed(this.seed + 17); // Consistent seed for gender field
        return faker.helpers.arrayElement(['Male', 'Female', 'X']);
      },
    };

    if (generators[generator]) {
      return args.length > 0 ? generators[generator](args[0]) : generators[generator]();
    }

    console.warn(`Unknown generator: ${generator}`);
    return '';
  }

  // Get faker-generated value
  getFakerValue(method, args = []) {
    // Re-seed for consistency when accessing faker
    faker.seed(this.seed);

    const parts = method.split('.');
    let fn = faker;

    for (const part of parts) {
      fn = fn[part];
      if (!fn) {
        console.warn(`Unknown faker method: ${method}`);
        return '';
      }
    }

    try {
      return typeof fn === 'function' ? fn(...args) : fn;
    } catch (e) {
      console.warn(`Error calling faker.${method}:`, e.message);
      return '';
    }
  }

  // Get AI-generated content (placeholder for integration)
  async getAIValue(fieldName, prompt, category) {
    if (this.useAI && this.aiCallback) {
      // Check if we already have AI-generated content cached
      if (!this.data.aiContent) {
        this.data.aiContent = {};
      }

      if (this.data.aiContent[category]) {
        return this.data.aiContent[category];
      }

      // Generate new AI content
      const content = await this.aiCallback(prompt, category, this.data);
      this.data.aiContent[category] = content;
      this.saveData();
      return content;
    }

    // Fallback to pre-defined descriptions
    if (category === 'disability_description') {
      return this.data.disability.description1;
    }
    if (category === 'disability_description_continued') {
      return this.data.disability.description2;
    }

    return '';
  }

  // Get checkbox value
  getCheckboxValue(fieldName, probability) {
    // Map field names to stored checkbox states
    const checkboxMap = {
      '17 - Gender': 'gender',
      '25 - Did you work that day?': 'didWorkOnDisabilityDay',
      '27 - Have you recovered from this disability?': 'hasRecovered',
      '32 - Have you since worked for wages or profit?': 'workedForWages',
      '73 - Union Member?': 'unionMember',
      '76 - Were you claiming or receiving unemployment prior to this disability?': 'unemploymentBenefits',
      '2 - A.\tAre you receiving wages, salary or separation pay?': 'receivingWages',
      '3 - Unemployment Benefits?': 'unemploymentBenefits',
      '4 - Paid Family Leave?': 'paidFamilyLeave',
      '5 - Workers Compensation?': 'workersComp',
      '6 - No fault motor vehicle accident?': 'noFaultAccident',
      '7 - personal injury involving third party?': 'thirdPartyInjury',
      '8 - Long-term disability benefits under the Federal Social Security Act for this disability?': 'longTermDisability',
      '17 - have you received disability benefits for other periods of disability?': 'priorDisability',
      '25 -  In the year (52 weeks) before your disability began, have you received Paid Family Leave?': 'priorPFL',
      '11 - Is the employee a member of a union?': 'unionMember',
      '18 - Were wages continued during disability?': 'wagesContinued',
      '20 - If yes, is reimbursement requested by employer?': 'reimbursementRequested',
      '21 - Is the employee\'s disability work-related?': false, // Always No for DBL
      '47 - In the preceding 52 weeks has the employee taken leave for:': 'priorLeave',
      '50 - Is employee still in your employment?': 'stillEmployed',
      '10 - Payment': 'directDeposit',
      '18 - Does employee contribute?': 'employeeContributes',
      '4 Checking account': 'checkingAccount',
      '4 Savings account': () => !this.data.checkboxes.checkingAccount,
      'EOBs': 'noEOBs',
      '14 - Employees Role': true, // Usually "Employee" checkbox
    };

    const key = checkboxMap[fieldName];

    if (key === undefined) {
      // Generate based on probability (seeded)
      faker.seed(this.seed + this.hashString(fieldName));
      return faker.datatype.boolean({ probability });
    }

    if (typeof key === 'boolean') {
      return key;
    }

    if (typeof key === 'function') {
      return key();
    }

    return this.data.checkboxes[key] || false;
  }

  getData() {
    return this.data;
  }
}

module.exports = { DataGenerator };
