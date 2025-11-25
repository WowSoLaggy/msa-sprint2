import { init } from './db.js';
import { startBookingController } from './bookingController.js';
import { startHttpServer } from './httpServer.js';

const port = process.env.PORT || 9090;
const httpPort = process.env.HTTP_PORT || 9091;

async function start() {
  await init();
  startBookingController(port);
  startHttpServer(httpPort);
}

start().catch(err => {
  console.error('Startup failed', err);
  process.exit(1);
});
