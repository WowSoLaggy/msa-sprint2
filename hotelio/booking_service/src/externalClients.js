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

// User validations (expected JSON: { active: bool, blacklisted: bool, status: string })
export async function getUserProfile(userId) {
  // TODO: adjust path to actual monolith endpoint
  return await safeFetch(`${BASE}/api/users/${userId}/profile`);
}

// Hotel operational & capacity (expected JSON: { operational: bool, fullyBooked: bool })
export async function getHotelState(hotelId) {
  // TODO: adjust path
  return await safeFetch(`${BASE}/api/hotels/${hotelId}/state`);
}

// Trusted hotel info (expected JSON: { trusted: bool })
export async function getHotelTrust(hotelId) {
  // TODO: adjust path
  return await safeFetch(`${BASE}/api/reviews/hotels/${hotelId}/trust`);
}

// Promo validation (expected JSON: { code: string, discount: number } or null)
export async function validatePromo(promoCode, userId) {
  if (!promoCode) return null;
  // TODO: adjust path
  return await safeFetch(`${BASE}/api/promocodes/validate?code=${encodeURIComponent(promoCode)}&userId=${encodeURIComponent(userId)}`);
}
