import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
  extend type Hotel @key(fields: "id") {
    id: ID!
  }

  type Booking @key(fields: "id") {
    id: ID!
    userId: String!
    hotelId: String!
    promoCode: String
    discountPercent: Int
    hotel: Hotel
  }

  type Query {
    bookingsByUser(userId: String!): [Booking]
  }
`;

// Общая заглушка бронирования (userId фиксирован)
function getStubBooking(id = 'b1') {
  return {
    id,
    userId: 'user1',
    hotelId: 'h1',
    discountPercent: 20,
    promoCode: 'SUMMER',
  };
}

const resolvers = {
  Query: {
    bookingsByUser: async (_, { userId }, { req }) => {

      const requesterUserId = req?.headers?.['userid'];
      console.log('[bookingsByUser] Requestor userId:', requesterUserId);
      console.log('[bookingsByUser] Requested userId:', userId);
      if (!requesterUserId || requesterUserId !== userId) {
        console.log('[bookingsByUser] Forbidden: Can request only own bookings')
        return [];
      }

      let allBookings = [ getStubBooking() ];
      console.log('[bookingsByUser] All bookings:', allBookings);
      allBookings = allBookings.filter(b => b.userId === userId);
      console.log('[bookingsByUser] Filtered bookings:', allBookings);

      return allBookings;
    },
  },
  Booking: {
    hotel: (parent) => ({ id: parent.hotelId }),

    __resolveReference: async (reference, { req }) => {
      const requesterUserId = req?.headers?.['userid'];
      console.log('[Booking.__resolveReference] Requestor userId:', requesterUserId);
      if (!requesterUserId) {
        console.log('[Booking.__resolveReference] Forbidden: No userId in headers')
        return null;
      }

      const booking = getStubBooking(reference?.id ?? 'b1');

      if (booking.userId !== requesterUserId) {
        console.log('[Booking.__resolveReference] Forbidden: Can access only own booking')
        return null;
      }

      console.log('[Booking.__resolveReference] Resolved booking:', booking);
      return booking;
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4001 },
  context: async ({ req }) => ({ req }),
}).then(() => {
  console.log('✅ Booking subgraph ready at http://localhost:4001/');
});
