import express from 'express';
import { initDb, pool } from './db.js';
import { startConsumer } from './bookingHistoryConsumer.js';

const PORT = process.env.PORT || 9094;

async function start() {
  await initDb();
  await startConsumer();

  const app = express();

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // GET /api/booking-history?userId=...
  app.get('/api/booking-history', async (req, res) => {
    const userId = req.query.userId;
    try {
      let q = 'SELECT * FROM booking_history ORDER BY event_received_at DESC LIMIT 200';
      let params = [];
      if (userId) {
        q = 'SELECT * FROM booking_history WHERE user_id = $1 ORDER BY event_received_at DESC LIMIT 200';
        params = [userId];
      }
      const { rows } = await pool.query(q, params);
      res.json(rows.map(r => ({
        bookingId: r.booking_id,
        userId: r.user_id,
        hotelId: r.hotel_id,
        promoCode: r.promo_code,
        discountPercent: r.discount_percent,
        price: r.price,
        bookingCreatedAt: r.created_at,
        storedAt: r.event_received_at,
        raw: r.raw_event
      })));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`[booking-history] HTTP listening on ${PORT}`);
  });
}

start().catch(err => {
  console.error('Startup failed', err);
  process.exit(1);
});