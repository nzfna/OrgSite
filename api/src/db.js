const { Pool } = require('pg');

// Pakai connection string Neon yang "-pooler" agar cocok dengan serverless.
if (!process.env.DATABASE_URL) {
  console.error('[fatal] DATABASE_URL belum diisi. API tidak bisa terhubung ke database.');
}

module.exports = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
