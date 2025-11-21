import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.BOOKING_DB_HOST || 'booking-db',
  port: +(process.env.BOOKING_DB_PORT || 5432),
  user: process.env.BOOKING_DB_USER || 'booking',
  password: process.env.BOOKING_DB_PASSWORD || 'booking',
  database: process.env.BOOKING_DB_NAME || 'booking'
});

// Added retry config + helpers
const RETRIES = +(process.env.BOOKING_DB_CONNECT_RETRIES || 10);
const DELAY_MS = +(process.env.BOOKING_DB_CONNECT_DELAY_MS || 3000);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ensureDb() {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log(`DB connected after ${attempt} attempts`);
      return;
    } catch (err) {
      console.error(`DB connect attempt ${attempt}/${RETRIES} failed: ${err.code || err.message}`);
      if (attempt === RETRIES) throw err;
      await sleep(DELAY_MS);
    }
  }
}

export async function init() {
  await ensureDb();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      hotel_id TEXT NOT NULL,
      promo_code TEXT,
      discount_percent DOUBLE PRECISION DEFAULT 0,
      price DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
