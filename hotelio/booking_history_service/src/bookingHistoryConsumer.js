import { Kafka } from 'kafkajs';
import { saveEvent } from './db.js';

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const topic = process.env.BOOKING_CREATED_TOPIC || 'booking.created';

const kafka = new Kafka({ clientId: 'booking-history-service', brokers });
const consumer = kafka.consumer({ groupId: 'booking-history-group' });

const maxRetries = +(process.env.KAFKA_CONNECT_MAX_RETRIES || 60); // total attempts
const retryDelayMs = +(process.env.KAFKA_CONNECT_RETRY_DELAY_MS || 5000);

async function connectWithRetry() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[booking-history] Kafka connect attempt ${attempt}/${maxRetries}`);
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log('[booking-history] Connected & subscribed to', topic);
      return;
    } catch (err) {
      console.warn(`[booking-history] Kafka connect failed attempt ${attempt}: ${err.message}`);
      if (attempt === maxRetries) {
        console.error('[booking-history] Kafka not reachable after max retries, continuing without consumer.');
        return; // Do not throw – service stays up
      }
      await new Promise(r => setTimeout(r, retryDelayMs));
    }
  }
}

export async function startConsumer() {
  await connectWithRetry();
  if (!consumer._isConnected) {
    console.warn('[booking-history] Consumer not connected, will retry in background.');
    // Background loop to recover later
    (async function backgroundRetry() {
      while (true) {
        try {
          await consumer.connect();
          await consumer.subscribe({ topic, fromBeginning: false });
          console.log('[booking-history] Background: connected to Kafka.');
          break;
        } catch (e) {
          console.warn('[booking-history] Background retry failed:', e.message);
          await new Promise(r => setTimeout(r, retryDelayMs));
        }
      }
      runConsumer();
    })();
  } else {
    runConsumer();
  }
}

function runConsumer() {
  consumer.run({
    eachMessage: async ({ message, partition }) => {
      try {
        const raw = message.value?.toString() || '{}';
        const evt = JSON.parse(raw);
        console.log('[booking-history] Event partition', partition, 'key', message.key?.toString());
        await saveEvent(evt);
        console.log('[booking-history] Persisted booking_id=', evt.id);
      } catch (e) {
        console.error('[booking-history] Failed to process message:', e.message);
      }
    }
  }).catch(e => console.error('[booking-history] Consumer run error:', e));
}