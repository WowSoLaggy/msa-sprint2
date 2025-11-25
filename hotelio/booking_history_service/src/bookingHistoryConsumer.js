import { Kafka } from 'kafkajs';
import { saveEvent } from './db.js';

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const topic = process.env.BOOKING_CREATED_TOPIC || 'booking.created';

const kafka = new Kafka({ clientId: 'booking-history-service', brokers });
const consumer = kafka.consumer({ groupId: 'booking-history-group' });

export async function startConsumer() {
  console.log('[booking-history] Connecting Kafka consumer...');
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  console.log('[booking-history] Subscribed to', topic);

  await consumer.run({
    eachMessage: async ({ message, partition }) => {
      try {
        const raw = message.value?.toString() || '{}';
        const evt = JSON.parse(raw);
        console.log('[booking-history] Event received partition', partition, 'key', message.key?.toString());
        await saveEvent(evt);
        console.log('[booking-history] Event persisted booking_id=', evt.id);
      } catch (e) {
        console.error('[booking-history] Failed to process message:', e.message);
      }
    }
  });
}