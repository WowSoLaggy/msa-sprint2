import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { listBookings, createBooking } from './bookingService.js';

const PROTO_PATH = new URL('../proto/booking.proto', import.meta.url).pathname;

const packageDef = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDef).booking;

function CreateBooking(call, callback) {
  const { user_id, hotel_id, promo_code } = call.request;
  createBooking({ userId: user_id, hotelId: hotel_id, promoCode: promo_code })
    .then(b => callback(null, {
      booking: {
        id: String(b.id),
        user_id: b.user_id,
        hotel_id: b.hotel_id,
        promo_code: b.promo_code || '',
        discount_percent: b.discount_percent,
        price: b.price
      }
    }))
    .catch(err => callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: err.message
    }));
}

function ListBookings(call, callback) {
  listBookings(call.request.user_id)
    .then(rows => callback(null, {
      bookings: rows.map(r => ({
        id: String(r.id),
        user_id: r.user_id,
        hotel_id: r.hotel_id,
        promo_code: r.promo_code || '',
        discount_percent: r.discount_percent,
        price: r.price
      }))
    }))
    .catch(err => callback({
      code: grpc.status.INTERNAL,
      message: err.message
    }));
}

function Health(call, callback) {
  callback(null, { status: 'ok' });
}

export function startBookingController(port = 50051) {
  const server = new grpc.Server();
  server.addService(proto.BookingService.service, {
    CreateBooking,
    ListBookings,
    Health
  });
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`[gRPC] BookingService listening on ${port}`);
    server.start();
  });
}
