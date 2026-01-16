/**
 * Field Mapping Configuration for NY DBL Form (DB-450)
 *
 * Each field is mapped to either:
 * - 'faker': Generated using faker-js with a specific method
 * - 'ai': Requires AI generation (sentence/paragraph form)
 * - 'calculated': Derived from other fields or business logic
 * - 'static': Fixed value
 * - 'checkbox': Boolean field with probability
 */

const FieldMappings = {
  // ===========================================
  // PART A - CLAIMANT'S INFORMATION (Page 1)
  // ===========================================

  // Personal Information
  '2 - Last Name': { type: 'faker', method: 'person.lastName' },
  '3 - First Name': { type: 'faker', method: 'person.firstName' },
  '3a - Middle Initial': { type: 'faker', method: 'string.alpha', args: [{ length: 1, casing: 'upper' }] },
  '4 - Mailing Address Street  Apt': { type: 'faker', method: 'location.streetAddress' },
  '5 - City': { type: 'faker', method: 'location.city' },
  '6 - State': { type: 'static', value: 'NY' },
  '7 - Zip': { type: 'faker', method: 'location.zipCode', args: ['#####'] },
  '9 - Daytime Phone': { type: 'faker', method: 'phone.number', args: ['###-###-####'] },
  '10 - Email Address': { type: 'faker', method: 'internet.email' },

  // SSN (split into 3 fields)
  '11 - Social Security 1': { type: 'faker', method: 'string.numeric', args: [3] },
  '12 - Social 2': { type: 'faker', method: 'string.numeric', args: [2] },
  '13 - Social Security': { type: 'faker', method: 'string.numeric', args: [4] },

  // Date of Birth (split into 3 fields: MM/DD/YYYY)
  '14 - Date of Birth': { type: 'calculated', generator: 'dobMonth' },
  '15 - Date of Birth': { type: 'calculated', generator: 'dobDay' },
  '16 - Date of Birth': { type: 'calculated', generator: 'dobYear' },

  // Gender Checkbox
  '17 - Gender': { type: 'checkbox', probability: 0.5 },

  // Disability Description - AI REQUIRED
  '20 -  Describe your disability if injury also state how when and where it occurred 1': {
    type: 'ai',
    prompt: 'Generate a brief medical disability description (1-2 sentences) for a non-work-related condition like back pain, knee injury, or recovery from surgery. Be specific but concise.',
    category: 'disability_description'
  },
  '21 -  Describe your disability if injury also state how when and where it occurred 2': {
    type: 'ai',
    prompt: 'Continue the disability description with additional details about how the injury/condition occurred, when it started, and current limitations.',
    category: 'disability_description_continued'
  },

  // Disability Dates (split fields)
  '22 - Date you became disabled': { type: 'calculated', generator: 'disabilityStartMonth' },
  '23 - Date you became disabled': { type: 'calculated', generator: 'disabilityStartDay' },
  '24 - Date you became diabled': { type: 'calculated', generator: 'disabilityStartYear' },

  // Work on disability day checkbox
  '25 - Did you work that day?': { type: 'checkbox', probability: 0.3 },

  // Recovery checkbox
  '27 - Have you recovered from this disability?': { type: 'checkbox', probability: 0.2 },

  // Return to work dates (if recovered)
  '29 - date you were able to return to work': { type: 'calculated', generator: 'returnToWorkMonth', conditional: 'recovered' },
  '30 - date you were able to return to work': { type: 'calculated', generator: 'returnToWorkDay', conditional: 'recovered' },
  '31 - date you were able to return to work': { type: 'calculated', generator: 'returnToWorkYear', conditional: 'recovered' },

  // Worked for wages checkbox
  '32 - Have you since worked for wages or profit?': { type: 'checkbox', probability: 0.1 },
  '34 - List Dates': { type: 'calculated', generator: 'workedForWagesDates' },

  // ===========================================
  // EMPLOYER INFORMATION (Part A continued)
  // ===========================================

  // Primary Employer - USE CONSISTENT DATA from stored employer
  '35 - Firm or Trade Name': { type: 'calculated', generator: 'employerBusinessName' },
  '36 - Address': { type: 'calculated', generator: 'employerFullAddress' },
  '37 - Phone Number': { type: 'calculated', generator: 'employerPhone' },
  '38 - First Day': { type: 'calculated', generator: 'employmentStartDate' },
  '39 - Last Day Worked': { type: 'calculated', generator: 'lastDayWorked' },
  '40 - Average Weekly Wage': { type: 'calculated', generator: 'averageWeeklyWage' },

  // Secondary Employer (often blank)
  '41 - Firm or Trade Name': { type: 'static', value: '' },
  '42 - Address': { type: 'static', value: '' },
  '43 - Phone Number': { type: 'static', value: '' },
  '44 - First Day': { type: 'static', value: '' },
  '45 - Last Day Worked': { type: 'static', value: '' },
  '46 - Average Weekly Wage': { type: 'static', value: '' },

  // Weekly wage breakdown (8 weeks)
  '47 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [1] },
  '48 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '49 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [1] },
  '50 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [2] },
  '51 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '52 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [2] },
  '53 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [3] },
  '54 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '55 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [3] },
  '56 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [4] },
  '57 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '58 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [4] },
  '59 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [5] },
  '60 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '61 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [5] },
  '62 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [6] },
  '63- No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '64 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [6] },
  '65 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [7] },
  '66 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '67 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [7] },
  '68 - Last Day Worked': { type: 'calculated', generator: 'weekEndDate', args: [8] },
  '69 - No of Days Worked': { type: 'faker', method: 'number.int', args: [{ min: 4, max: 5 }] },
  '70 - Gross Amount Paid': { type: 'calculated', generator: 'weeklyWage', args: [8] },
  '71 - Calculated average gross weekly wage:': { type: 'calculated', generator: 'averageWeeklyWage' },

  // Occupation and Union
  '72 -  My job is or was': { type: 'faker', method: 'person.jobTitle' },
  '73 - Union Member?': { type: 'checkbox', probability: 0.15 },
  '75 - Name of Union': { type: 'calculated', generator: 'unionName', conditional: 'unionMember' },

  // Unemployment (Item 12)
  '76 - Were you claiming or receiving unemployment prior to this disability?': { type: 'checkbox', probability: 0.1 },
  '78 - Explain': { type: 'calculated', generator: 'unemploymentExplanation' },
  '79 - Explain': { type: 'static', value: '' }, // continuation of above
  '80 - If you did receive unemployment benefits, provide all periods collected': { type: 'calculated', generator: 'unemploymentPeriods' },

  // ===========================================
  // PART A - PAGE 2 (Claims and Benefits)
  // ===========================================

  '1 - Claim Number': { type: 'static', value: '' }, // Usually assigned by insurer

  // ===========================================
  // ITEM 13 - Benefits checkboxes
  // ===========================================
  '2 - A.\tAre you receiving wages, salary or separation pay?': { type: 'checkbox', probability: 0.3 },
  '3 - Unemployment Benefits?': { type: 'checkbox', probability: 0.1 },
  '4 - Paid Family Leave?': { type: 'checkbox', probability: 0.1 },
  '5 - Workers Compensation?': { type: 'checkbox', probability: 0.05 },
  '6 - No fault motor vehicle accident?': { type: 'checkbox', probability: 0.08 },
  '7 - personal injury involving third party?': { type: 'checkbox', probability: 0.05 },
  '8 - Long-term disability benefits under the Federal Social Security Act for this disability?': { type: 'checkbox', probability: 0.05 },
  '9 - If yes is checked': { type: 'checkbox-multi', generator: 'receivedOrClaimed' }, // Options: 'Received', 'Claimed'

  // Item 13 - "IF YES" conditional fields (claimed from, period dates)
  '10 - Claimed from': { type: 'calculated', generator: 'claimedFrom' },
  '11 - for the period': { type: 'calculated', generator: 'claimedPeriodStartMonth' },
  '12 - for the period of': { type: 'calculated', generator: 'claimedPeriodStartDay' },
  '13 - for the period of': { type: 'calculated', generator: 'claimedPeriodStartYear' },
  '14 - for the period': { type: 'calculated', generator: 'claimedPeriodEndMonth' },
  '15 - for the period of': { type: 'calculated', generator: 'claimedPeriodEndDay' },
  '16 - for the period of': { type: 'calculated', generator: 'claimedPeriodEndYear' },

  // ===========================================
  // ITEM 14 - Prior disability benefits
  // ===========================================
  '17 - have you received disability benefits for other periods of disability?': { type: 'checkbox', probability: 0.15 },
  '18 - If yes Paid by': { type: 'calculated', generator: 'priorDisabilityPaidBy' },
  '19 - From': { type: 'calculated', generator: 'priorDisabilityStartMonth' },
  '20 - From': { type: 'calculated', generator: 'priorDisabilityStartDay' },
  '21 - From': { type: 'calculated', generator: 'priorDisabilityStartYear' },
  '22 - To': { type: 'calculated', generator: 'priorDisabilityEndMonth' },
  '23 - To': { type: 'calculated', generator: 'priorDisabilityEndDay' },
  '24 - To': { type: 'calculated', generator: 'priorDisabilityEndYear' },

  // ===========================================
  // ITEM 15 - Prior PFL
  // ===========================================
  '25 -  In the year (52 weeks) before your disability began, have you received Paid Family Leave?': { type: 'checkbox', probability: 0.1 },
  '26 - If yes Paid by': { type: 'calculated', generator: 'priorPFLPaidBy' },
  '27 - From': { type: 'calculated', generator: 'priorPFLStartMonth' },
  '28 - From': { type: 'calculated', generator: 'priorPFLStartDay' },
  '29 - From': { type: 'calculated', generator: 'priorPFLStartYear' },
  '30 - To': { type: 'calculated', generator: 'priorPFLEndMonth' },
  '31 - To': { type: 'calculated', generator: 'priorPFLEndDay' },
  '32 - To': { type: 'calculated', generator: 'priorPFLEndYear' },

  // Signature info
  '33 - Signature Date': { type: 'calculated', generator: 'signatureDate' },
  '34 - Address of signatory on behalf of the claimant': { type: 'static', value: '' },
  '35 - Relationship to Claimant': { type: 'static', value: '' },

  // ===========================================
  // PART C - EMPLOYER INFORMATION
  // ===========================================

  '2 - Business Name': { type: 'calculated', generator: 'employerBusinessName' },
  '3 - Mailing Address': { type: 'calculated', generator: 'employerAddress' },
  '4 - City State Zip Code': { type: 'calculated', generator: 'employerCityStateZip' },
  '5 - Country if not USA': { type: 'static', value: '' },
  '6 - Employers FEIN': { type: 'calculated', generator: 'employerFEIN1' },
  '6a - Employers FEIN': { type: 'calculated', generator: 'employerFEIN2' },
  '6a - FEIN2': { type: 'static', value: '' }, // Duplicate field

  '7 - Employers contact name for questions relating to disability': { type: 'calculated', generator: 'employerContactName' },
  '9 - Employers contact phone number': { type: 'calculated', generator: 'employerContactPhone' },
  '10 - Employers contact email address': { type: 'calculated', generator: 'employerEmail' },

  '11 - Is the employee a member of a union?': { type: 'calculated', generator: 'unionMemberCheckbox' },
  '12 - If yes provide Union name address and contact information': { type: 'static', value: '' },
  '13 - If yes provide Union name address and contact information': { type: 'static', value: '' },

  '14 - Employees Role': { type: 'checkbox', probability: 0.95 }, // Usually "Employee"

  '15 - Employees date of hire': { type: 'calculated', generator: 'hireDate' },
  '16 - Date employee last worked': { type: 'calculated', generator: 'lastDayWorkedFormatted' },
  '17 - Date employee returned to work if applicable': { type: 'static', value: '' },

  '18 - Were wages continued during disability?': { type: 'checkbox', probability: 0.3 },
  '19 - If yes what type PTO sick time other': { type: 'calculated', generator: 'wagesContinuedType' },
  '20 - If yes, is reimbursement requested by employer?': { type: 'checkbox', probability: 0.2 },
  '21 - Is the employee\'s disability work-related?': { type: 'checkbox', probability: 0.0 }, // Always No for DBL

  // Employer wage breakdown (8 weeks) - mirrors Part A
  '22 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [1] },
  '23 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [1] },
  '24 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [1] },
  '25 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [2] },
  '26 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [2] },
  '27 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [2] },
  '28 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [3] },
  '29 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [3] },
  '30 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [3] },
  '31 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [4] },
  '32 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [4] },
  '33 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [4] },
  '34 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [5] },
  '35 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [5] },
  '36 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [5] },
  '37 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [6] },
  '38 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [6] },
  '39 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [6] },
  '40 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [7] },
  '41 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [7] },
  '42 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [7] },
  '43 - Week ending date': { type: 'calculated', generator: 'weekEndDateFormatted', args: [8] },
  '44 - No of days worked': { type: 'calculated', generator: 'daysWorkedWeek', args: [8] },
  '45 - Gross amount paid': { type: 'calculated', generator: 'weeklyWageFormatted', args: [8] },
  '46 - Gross amount paidCalculated average gross weekly wage': { type: 'calculated', generator: 'averageWeeklyWageFormatted' },

  '47 - In the preceding 52 weeks has the employee taken leave for:': { type: 'checkbox-multi', generator: 'priorLeaveType' }, // Options: 'NYS#20Disability', 'PFL', 'Both', 'None'
  '48 - Disability Please provide specific dates for disability': { type: 'calculated', generator: 'priorDisabilityDates' },
  '49 - PFL: Please provide specific dates for PFL': { type: 'calculated', generator: 'priorPFLDates' },

  '50 - Is employee still in your employment?': { type: 'checkbox', probability: 0.85 },
  '51 - If no date employment was terminated': { type: 'static', value: '' },
  '52 - If employee received unemployment benefits date the benefit was last received': { type: 'static', value: '' },

  // Employer signature section
  '1 - Employer Name and Title': { type: 'calculated', generator: 'employerSignatoryNameTitle' },
  '2 - Employer Contact Phone Number': { type: 'calculated', generator: 'employerContactPhone' },
  '3 - Date': { type: 'calculated', generator: 'employerSignatureDate' },

  // ===========================================
  // DB450 SUPPLEMENT
  // ===========================================

  '10 - Payment': { type: 'checkbox', probability: 0.7 }, // Direct Deposit preference
  '11 - Date signed': { type: 'calculated', generator: 'supplementSignatureDate' },
  '12 - Date Signed': { type: 'calculated', generator: 'supplementSignatureDate' },
  '13 - Date signed': { type: 'calculated', generator: 'supplementSignatureDate' },

  '18 - Does employee contribute?': { type: 'checkbox', probability: 0.6 },
  '19 - Yes  dollar amount per week': { type: 'static', value: '0.60' },
  '20 - percentage of contribution': { type: 'static', value: '' },

  '21 - Employer Name  and Title': { type: 'calculated', generator: 'employerSignatoryNameTitle' },
  '22 - Employer Contact Email': { type: 'calculated', generator: 'employerEmail' },
  '23 - Employer Contact Phone': { type: 'calculated', generator: 'employerPhoneAreaCode' },
  '24 - Employer Contact Phone': { type: 'calculated', generator: 'employerPhoneNumber' },
  '25 - Date Signed': { type: 'calculated', generator: 'supplementSignatureDate' },
  '26 - Date Signed': { type: 'calculated', generator: 'supplementSignatureDate' },
  '27 - Date Signed': { type: 'calculated', generator: 'supplementSignatureDate' },

  // ===========================================
  // DIRECT DEPOSIT FORM
  // ===========================================

  '4 Checking account': { type: 'checkbox', probability: 0.8 },
  '4 Savings account': { type: 'checkbox', probability: 0.2 },
  'EOBs': { type: 'checkbox', probability: 0.3 },
  'Date mmddyyyy': { type: 'calculated', generator: 'directDepositSignatureDate' },

  // ===========================================
  // POLICY NUMBER (Part C header)
  // ===========================================

  '1 - Policy Number': { type: 'calculated', generator: 'policyNumber' },
};

// AI-required fields that need special handling
const AIFields = [
  '20 -  Describe your disability if injury also state how when and where it occurred 1',
  '21 -  Describe your disability if injury also state how when and where it occurred 2',
];

// Sample disability descriptions for non-AI mode (fallback)
const SampleDisabilityDescriptions = [
  {
    line1: 'Lower back strain with herniated disc L4-L5. Pain radiates down left leg.',
    line2: 'Occurred while lifting boxes at home on 12/15/2025. Currently unable to sit or stand for extended periods.'
  },
  {
    line1: 'Right knee injury - torn meniscus requiring surgical repair.',
    line2: 'Slipped on ice in parking lot on 01/02/2026. Surgery scheduled, recovery expected 6-8 weeks.'
  },
  {
    line1: 'Post-surgical recovery following appendectomy due to acute appendicitis.',
    line2: 'Emergency surgery performed on 12/28/2025. Restricted from lifting over 10 lbs during recovery.'
  },
  {
    line1: 'Severe migraine disorder with visual aura and photophobia.',
    line2: 'Condition worsened significantly in early January 2026. Unable to work due to frequency and severity of episodes.'
  },
  {
    line1: 'Fractured right wrist (distal radius) from fall.',
    line2: 'Fell on stairs at home on 01/05/2026. Cast applied, unable to perform job duties requiring manual dexterity.'
  }
];

module.exports = {
  FieldMappings,
  AIFields,
  SampleDisabilityDescriptions
};
