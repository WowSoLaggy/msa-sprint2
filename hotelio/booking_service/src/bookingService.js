import { pool } from './db.js';
import { getUserProfile, getHotelState, getHotelTrust, validatePromo } from './externalClients.js';

function log(...args) {
  console.log('[booking-service]', ...args);
}

export async function listBookings(userId) {
  if (userId) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }
  const { rows } = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
  return rows;
}

export async function createBooking({ userId, hotelId, promoCode }) {
  log('Creating booking', { userId, hotelId, promoCode });

  await validateUser(userId);
  await validateHotel(hotelId);

  const basePrice = await resolveBasePrice(userId);
  const discount = await resolvePromoDiscount(promoCode, userId);
  const finalPrice = basePrice - discount;

  log('Price computed', { basePrice, discount, finalPrice });

  const insert = await pool.query(
    `INSERT INTO bookings (user_id, hotel_id, promo_code, discount_percent, price)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, hotelId, promoCode || null, discount, finalPrice]
  );
  return insert.rows[0];
}

async function validateUser(userId) {
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('User not found');
  if (!profile.active) throw new Error('User is inactive');
  if (profile.blacklisted) throw new Error('User is blacklisted');
}

async function validateHotel(hotelId) {
  const state = await getHotelState(hotelId);
  if (!state || !state.operational) throw new Error('Hotel is not operational');
  const trust = await getHotelTrust(hotelId);
  if (!trust || !trust.trusted) throw new Error('Hotel is not trusted based on reviews');
  if (state.fullyBooked) throw new Error('Hotel is fully booked');
}

async function resolveBasePrice(userId) {
  const profile = await getUserProfile(userId);
  const status = profile?.status;
  const isVip = status && status.toUpperCase() === 'VIP';
  const price = isVip ? 80.0 : 100.0;
  log('Base price', { userId, status, price });
  return price;
}

async function resolvePromoDiscount(promoCode, userId) {
  if (!promoCode) return 0.0;
  const promo = await validatePromo(promoCode, userId);
  if (!promo) {
    log('Promo invalid', { promoCode, userId });
    return 0.0;
  }
  log('Promo applied', { promoCode, discount: promo.discount });
  return +promo.discount || 0.0;
}
