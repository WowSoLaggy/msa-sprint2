const MONOLITH_HOST = process.env.MONOLITH_HOST || 'monolith';
const MONOLITH_PORT = process.env.MONOLITH_PORT || '8080';
const BASE = `http://${MONOLITH_HOST}:${MONOLITH_PORT}`;

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getUserActive(userId) {
  console.log(`getUserActive: \'${userId}\'`)
  const response = await safeFetch(`${BASE}/api/users/${userId}/active`);
  console.log('Response:', response)
  return response;
}

export async function getUserBlacklisted(userId) {
  console.log(`getUserBlacklisted: \'${userId}\'`)
  const response = await safeFetch(`${BASE}/api/users/${userId}/blacklisted`);
  console.log('Response:', response)
  return response;
}

export async function getUserVip(userId) {
  console.log(`getUserVip: \'${userId}\'`)
  const response = await safeFetch(`${BASE}/api/users/${userId}/vip`);
  console.log('Response:', response)
  return response;
}

export async function getHotelOperational(hotelId) {
  console.log(`getHotelOperational: \'${hotelId}\'`)
  const response = await safeFetch(`${BASE}/api/hotels/${hotelId}/operational`);
  console.log('Response:', response)
  return response;
}

export async function getHotelTrusted(hotelId) {
  console.log(`getHotelTrusted: \'${hotelId}\'`)
  const response = await safeFetch(`${BASE}/api/reviews/hotel/${hotelId}/trusted`);
  console.log('Response:', response)
  return response;
}

export async function getHotelFullyBooked(hotelId) {
  console.log(`getHotelFullyBooked: \'${hotelId}\'`)
  const response = await safeFetch(`${BASE}/api/hotels/${hotelId}/fully-booked`);
  console.log('Response:', response)
  return response;
}

export async function validatePromo(promoCode, userId) {
  if (!promoCode) return null;
  const response = await safeFetch(`${BASE}/api/promocodes/validate?code=${encodeURIComponent(promoCode)}&userId=${encodeURIComponent(userId)}`);
  console.log('Response:', response)
  return response;
}
