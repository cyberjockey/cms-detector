import path from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';
import detectCMS from './detectCMS.js';
import readCSV from './readCSV.js';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../data/urls.csv');
const CONCURRENCY = 5;
const limit = pLimit(CONCURRENCY);

const { Pool } = pg;
// Use DATABASE_URL from Railway environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create results table if not exists
async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_results (
      id SERIAL PRIMARY KEY,
      company TEXT,
      url TEXT,
      cms TEXT,
      reason TEXT
    )
  `);
}

async function insertResult(company, url, cms, reason) {
  await pool.query(
    'INSERT INTO cms_results (company, url, cms, reason) VALUES ($1, $2, $3, $4)',
    [company, url, cms, reason]
  );
}

async function main() {
  const websites = await readCSV(INPUT_FILE);
  await createTable();

  const promises = websites.map(entry =>
    limit(async () => {
      const { company, url } = entry;
      const result = await detectCMS(url);
      console.log(`[✓] ${url} → ${result.cms}`);

      await insertResult(company, url, result.cms, result.reason);
    })
  );

  await Promise.all(promises);
  console.log('✅ Done! Results saved to PostgreSQL database.');
  // Close DB connection
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  pool.end();
});
