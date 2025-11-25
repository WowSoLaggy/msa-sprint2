import { pool } from './db.js';
import { getUserActive, getUserBlacklisted, getUserVip, getHotelOperational, getHotelTrusted, getHotelFullyBooked, validatePromo } from './externalClients.js';


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

  const retVal = {
    id: inserted.id,
    user_id: inserted.user_id,
    hotel_id: inserted.hotel_id,
    promo_code: inserted.promo_code || promoCode || '',
    discount_percent: Number(inserted.discount_percent ?? discount ?? 0),
    price: Number(inserted.price ?? finalPrice ?? 0),
    created_at: new Date(inserted.created_at).toISOString()
  };
  console.log('Created booking', retVal);

  return retVal;
}

async function validateUser(userId) {
  console.log(`Validating user: \'${userId}'`)

  const active = await getUserActive(userId);
  if (!active) throw new Error('User is inactive');

  const blacklisted = await getUserBlacklisted(userId);
  if (blacklisted) throw new Error('User is blacklisted');

  console.log('User validated OK')
}

async function validateHotel(hotelId) {
  console.log(`Validating hotel: \'${hotelId}'`)

  const operational = await getHotelOperational(hotelId);
  if (!operational) throw new Error('Hotel is not operational');

  const trusted = await getHotelTrusted(hotelId);
  if (!trusted) throw new Error('Hotel is not trusted based on reviews');

  const fullyBooked = await getHotelFullyBooked(hotelId);
  if (fullyBooked) throw new Error('Hotel is fully booked');

  console.log('Hotel validated OK')
}

async function resolveBasePrice(userId) {
  const isVip = await getUserVip(userId);
  const price = isVip ? 80.0 : 100.0;
  console.log('Base price', { userId, isVip, price });
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
