import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const csv = require('csv-parser');

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export default readCSV;
