import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { listBookings, createBooking } from './bookingService.js';

const PROTO_PATH = new URL('../proto/booking.proto', import.meta.url).pathname;

const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true });
const proto = grpc.loadPackageDefinition(packageDef).booking;

function CreateBooking(call, callback) {
  const { user_id, hotel_id, promo_code } = call.request;
  console.log(`Creating booking for user_id: \'${user_id}\'`);
  createBooking({ userId: user_id, hotelId: hotel_id, promoCode: promo_code })
    .then(b => callback(null, b)) // pass through normalized object
    .catch(err => callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: err.message
    }));
}

function ListBookings(call, callback) {
  console.log(`Listing bookings for user_id: \'${call.request.user_id}\'`);
  listBookings(call.request.user_id)
    .then(rows => callback(null, {
      bookings: rows
    })) // service already normalized
    .catch(err => callback({
      code: grpc.status.INTERNAL,
      message: err.message
    }));
}

export function startBookingController(port = 50051) {
  const server = new grpc.Server();
  server.addService(proto.BookingService.service, {
    CreateBooking,
    ListBookings
  });
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`[gRPC] BookingService listening on ${port}`);
    server.start();
  });
}
