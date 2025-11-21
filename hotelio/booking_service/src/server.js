import { init } from './db.js';
import { startBookingController } from './bookingController.js';

const port = process.env.PORT || 9090;

async function start() {
  await init();
  startBookingController(port);
}

start().catch(err => {
  console.error('Startup failed', err);
  process.exit(1);
});
