const { DataGenerator } = require('./data-generator');
const fs = require('fs');

// Clean up any existing data for a fresh test
if (fs.existsSync('./generated-data/debug-gender.json')) {
  fs.unlinkSync('./generated-data/debug-gender.json');
}

const generator = new DataGenerator('debug-gender');
const data = generator.getData();

console.log('Claimant Object:', JSON.stringify(data.claimant, null, 2));
console.log('Gender Selection Value:', generator.getCalculatedValue('genderSelection'));
