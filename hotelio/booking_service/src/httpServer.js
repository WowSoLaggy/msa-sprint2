import express from 'express';
import { listBookings, createBooking } from './bookingService.js';

function mapBooking(b) {
  return {
    id: b.id,
    userId: b.user_id,
    hotelId: b.hotel_id,
    promoCode: b.promo_code || '',
    discountPercent: b.discount_percent,
    price: b.price,
    createdAt: b.created_at
  };
}

export function startHttpServer(port = process.env.HTTP_PORT || 9091) {
  const app = express();
  app.use(express.json());

  // GET /api/bookings?userId=...
  app.get('/api/bookings', async (req, res) => {
    const userId = req.query.userId || req.query.user_id;
    try {
      const rows = await listBookings(userId);
      res.json(rows.map(mapBooking));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/bookings (query or JSON body)
  app.post('/api/bookings', async (req, res) => {
    const userId = req.query.userId || req.body.userId || req.body.user_id;
    const hotelId = req.query.hotelId || req.body.hotelId || req.body.hotel_id;
    const promoCode = req.query.promoCode || req.body.promoCode || req.body.promo_code || null;

    if (!userId || !hotelId) {
      return res.status(400).json({ error: 'userId and hotelId are required' });
    }

    try {
      const booking = await createBooking({ userId, hotelId, promoCode });
      res.json(mapBooking(booking));
    } catch (e) {
      const validation = /inactive|blacklisted|not operational|not trusted|fully booked/i.test(e.message);
      res.status(validation ? 400 : 500).json({ error: e.message });
    }
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(port, () => {
    console.log(`[HTTP] Booking HTTP API listening on ${port}`);
  });
}