import { pool } from './db.js';
import { getUserProfile, getHotelState, getHotelTrust, validatePromo } from './externalClients.js';


export async function listBookings(userId) {
  let query;
  let params = [];

  if (userId) {
    query = `
      SELECT * FROM bookings
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    params = [userId];
  } else {
    query = `
      SELECT * FROM bookings
      ORDER BY created_at DESC
    `;
  }
  console.log(`Listing bookings with query:`);
  console.log(`${query}`);
  console.log(`and params: \'${params}\'`);

  const { rows } = await pool.query(query, params);
  console.log(`Found ${rows.length} bookings for user_id: \'${userId}\'`);

  const retVal = rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    hotel_id: r.hotel_id,
    promo_code: r.promo_code || '',
    discount_percent: Number(r.discount_percent || 0),
    price: Number(r.price || 0),
    created_at: new Date(r.created_at).toISOString()
  }));
  console.log('Returning bookings:', retVal);

  return retVal;
}

export async function createBooking({ userId, hotelId, promoCode }) {
  console.log('Creating booking', { userId, hotelId, promoCode });

  await validateUser(userId);
  await validateHotel(hotelId);

  const basePrice = await resolveBasePrice(userId);
  const discount = await resolvePromoDiscount(promoCode, userId);
  const finalPrice = basePrice - discount;
  const createdAt = new Date().toISOString();

  console.log('Price computed', { basePrice, discount, finalPrice });

  const insert = await pool.query(
    `INSERT INTO bookings (user_id, hotel_id, promo_code, discount_percent, price, created_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, hotelId, promoCode || null, discount, finalPrice, createdAt]
  );
  const inserted = insert.rows[0];
  return {
    id: inserted.id,
    user_id: inserted.user_id,
    hotel_id: inserted.hotel_id,
    promo_code: inserted.promo_code || promoCode || '',
    discount_percent: Number(inserted.discount_percent ?? discount ?? 0),
    price: Number(inserted.price ?? finalPrice ?? 0),
    created_at: inserted.created_at || createdAt
  };
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
  console.log('Base price', { userId, status, price });
  return price;
}

async function resolvePromoDiscount(promoCode, userId) {
  if (!promoCode) return 0.0;
  const promo = await validatePromo(promoCode, userId);
  if (!promo) {
    console.log('Promo invalid', { promoCode, userId });
    return 0.0;
  }
  console.log('Promo applied', { promoCode, discount: promo.discount });
  return +promo.discount || 0.0;
}
