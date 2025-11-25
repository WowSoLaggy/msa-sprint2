import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});
console.log('[bookingEvents] Kafka init with brokers:', (process.env.KAFKA_BROKERS || 'localhost:9092'));

const producer = kafka.producer();
let started = false;

export async function initBookingEvents() {
  if (!started) {
    console.log('[bookingEvents] Connecting Kafka producer...');
    await producer.connect();
    started = true;
    console.log('[bookingEvents] Kafka producer connected');
  } else {
    console.log('[bookingEvents] Kafka producer already connected, skip');
  }
}

export async function publishBookingCreated(booking) {
  if (!started) await initBookingEvents();
  console.log('[bookingEvents] Preparing BOOKING_CREATED payload for booking id:', booking.id);

  const payload = {
    id: booking.id,
    user_id: booking.user_id,
    hotel_id: booking.hotel_id,
    promo_code: booking.promo_code,
    discount_percent: booking.discount_percent,
    price: booking.price,
    created_at: booking.created_at,
    type: 'BOOKING_CREATED',
    occurred_at: new Date().toISOString()
  };

  const topic = process.env.BOOKING_CREATED_TOPIC || 'booking.created';
  console.log('[bookingEvents] Sending to topic:', topic, 'payload:', payload);

  try {
    const res = await producer.send({
      topic,
      messages: [
        {
          key: String(payload.id),
            value: JSON.stringify(payload)
        }
      ]
    });
    console.log('[bookingEvents] Published booking.created event result:', res);
  } catch (e) {
    console.error('[bookingEvents] Failed to publish booking.created event for id:', booking.id, 'error:', e.message);
  }
}