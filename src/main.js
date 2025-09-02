import path from 'path';
import { fileURLToPath } from 'url';
import { createArrayCsvWriter } from 'csv-writer';
import pLimit from 'p-limit';
import detectCMS from './detectCMS.js';
import readCSV from './readCSV.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../data/urls.csv');
const OUTPUT_FILE = path.join(__dirname, '../output/cms_results.csv');

const CONCURRENCY = 5;
const limit = pLimit(CONCURRENCY);

// Setup a streaming CSV writer with header
const csvWriter = createArrayCsvWriter({
  path: OUTPUT_FILE,
  header: ['Company', 'URL', 'CMS', 'Detection Reason'],
  append: false,        // Overwrite file if exists
});

// Write CSV header first
async function writeHeader() {
  await csvWriter.writeRecords([]); // Writes header only
}

async function main() {
  const websites = await readCSV(INPUT_FILE);

  await writeHeader();

  // Process with concurrency limit
  const promises = websites.map(entry =>
    limit(async () => {
      const { company, url } = entry;
      const result = await detectCMS(url);
      console.log(`[✓] ${url} → ${result.cms}`);

      // Write each result row immediately
      await csvWriter.writeRecords([[company, url, result.cms, result.reason]]);
    })
  );

  await Promise.all(promises);

  console.log('✅ Done! Results written to output file.');
}

main().catch(console.error);
