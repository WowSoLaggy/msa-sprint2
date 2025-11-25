import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'booking-history-db',
  port: +(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'booking_history',
  password: process.env.POSTGRES_PASSWORD || 'booking_history',
  database: process.env.POSTGRES_DB || 'booking_history'
});

export async function initDb() {
  await pool.query('SELECT 1');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id BIGSERIAL PRIMARY KEY,
      booking_id TEXT,
      user_id TEXT,
      hotel_id TEXT,
      promo_code TEXT,
      discount_percent DOUBLE PRECISION,
      price DOUBLE PRECISION,
      created_at TIMESTAMP,
      event_received_at TIMESTAMP DEFAULT NOW(),
      raw_event JSONB
    );
  `);
}

export async function saveEvent(evt) {
  const {
    id: booking_id,
    user_id,
    hotel_id,
    promo_code,
    discount_percent,
    price,
    created_at
  } = evt;
  await pool.query(
    `INSERT INTO booking_history
     (booking_id, user_id, hotel_id, promo_code, discount_percent, price, created_at, raw_event)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [booking_id, user_id, hotel_id, promo_code || null, discount_percent, price, created_at ? new Date(created_at) : null, evt]
  );
}