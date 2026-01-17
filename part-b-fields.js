/**
 * Coordinate mappings for Part B - Health Care Provider
 * These fields are filled by drawing text at specific (x, y) coordinates.
 * Target Page: Index 4 (Page 5)
 */

const PartBCoordinates = {
  // Claimant Info (Repeated)
  'last name claimant': { x: 100, y: 366, type: 'text', source: 'claimant.lastName' },
  'first name claimant': { x: 328, y: 366, type: 'text', source: 'claimant.firstName' },
  'middle initial claimant': { x: 514, y: 366, type: 'text', source: 'claimant.middleInitial' },
  
  // Gender
  'gender male': { x: 87, y: 349, type: 'check', source: 'claimant.gender', value: 'Male' },
  'gender female': { x: 116, y: 349, type: 'check', source: 'claimant.gender', value: 'Female' },
  'gender X': { x: 142, y: 349, type: 'check', source: 'claimant.gender', value: 'X' },
  
  // DOB
  'DOB mm': { x: 252, y: 349, type: 'date-part', source: 'claimant.dateOfBirth', part: 'month' },
  'DOB dd': { x: 276, y: 349, type: 'date-part', source: 'claimant.dateOfBirth', part: 'day' },
  'DOB yyyy': { x: 309, y: 349, type: 'date-part', source: 'claimant.dateOfBirth', part: 'year' },

  // Medical Info (AI Generated)
  'Diagnosis analysis': { x: 135, y: 336, type: 'text', source: 'medical.diagnosisAnalysis', limit: 70 },
  'diagnosis code': { x: 462, y: 336, type: 'text', source: 'medical.icdCode' },
  'claimant symptoms': { x: 158, y: 319, type: 'text', source: 'medical.symptoms', limit: 70 },
  'objective findings': { x: 141, y: 290, type: 'text', source: 'medical.objectiveFindings', limit: 70 },

  // Hospitalization
  'claimant hospitalized yes': { x: 154, y: 265, type: 'boolean-check', source: 'medical.hospitalized', value: true },
  'claimant hospitalized no': { x: 185, y: 263, type: 'boolean-check', source: 'medical.hospitalized', value: false },
  // Hospital dates skipped for now as they depend on the boolean

  // Operation
  'operation indicated yes': { x: 154, y: 246, type: 'boolean-check', source: 'medical.surgery', value: true },
  'opeariton indicated no': { x: 184, y: 246, type: 'boolean-check', source: 'medical.surgery', value: false },
  
  // Treatment Dates
  'date of first treatment mm': { x: 339, y: 216, type: 'date-part', source: 'medical.firstTreatment', part: 'month' },
  'date of first treatment dd': { x: 424, y: 216, type: 'date-part', source: 'medical.firstTreatment', part: 'day' },
  'date of first treatment yyyy': { x: 504, y: 216, type: 'date-part', source: 'medical.firstTreatment', part: 'year' },

  'date of most recent treatment mm': { x: 340, y: 205, type: 'date-part', source: 'medical.recentTreatment', part: 'month' },
  'date of most recent treatment dd': { x: 424, y: 205, type: 'date-part', source: 'medical.recentTreatment', part: 'day' },
  'date of most recent treatment yyyy': { x: 506, y: 205, type: 'date-part', source: 'medical.recentTreatment', part: 'year' },

  // Work Ability Dates
  'date claimant unable to work from mm': { x: 339, y: 193, type: 'date-part', source: 'dates.disabilityStart', part: 'month' },
  'date claimant unable to work from dd': { x: 425, y: 193, type: 'date-part', source: 'dates.disabilityStart', part: 'day' },
  'date claimant unable to work from yyyy': { x: 505, y: 193, type: 'date-part', source: 'dates.disabilityStart', part: 'year' },

  'date claimant able to work again mm': { x: 339, y: 179, type: 'date-part', source: 'dates.returnToWork', part: 'month' },
  'date claimant able to work again dd': { x: 425, y: 179, type: 'date-part', source: 'dates.returnToWork', part: 'day' },
  'date claimant able to work again yyyy': { x: 504, y: 179, type: 'date-part', source: 'dates.returnToWork', part: 'year' },

  // Work Related
  'is the injury result of work yes': { x: 52, y: 126, type: 'boolean-check', source: 'medical.workRelated', value: true },
  'is the injury result of work no': { x: 83, y: 126, type: 'boolean-check', source: 'medical.workRelated', value: false },

  // Provider Info
  'health care provider role (physician, chircopractor, dentist, podiatrist, psychologist, nurse, midwife)': { 
    x: 44, y: 95, type: 'text', source: 'medicalProvider.role' 
  },
  'license or certified state': { x: 295, y: 94, type: 'static', value: 'NY' },
  'license number': { x: 433, y: 96, type: 'text', source: 'medicalProvider.licenseNumber' },
  
  'health care providers name': { x: 48, y: 67, type: 'text', source: 'medicalProvider.fullName' },
  'date': { x: 482, y: 68, type: 'date-now' },
  
  'health care providers address': { x: 50, y: 44, type: 'text', source: 'medicalProvider.address' },
  'phone number (pay attention to certified/licensed state area code)': { x: 454, y: 43, type: 'text', source: 'medicalProvider.phone' }
};

module.exports = { PartBCoordinates };