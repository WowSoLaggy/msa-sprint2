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

const bookings = [
  { id: 'b1', userId: 'user1', hotelId: 'h1', promoCode: 'SUPER25', discountPercent: 25 },
  { id: 'b2', userId: 'user1', hotelId: 'h2', promoCode: null, discountPercent: 0 },
  { id: 'b3', userId: 'user2', hotelId: 'h1', promoCode: 'HOTEL10', discountPercent: 10 },
]

const resolvers = {
  Query: {
    bookingsByUser: async (_, { userId }, { req }) => {
      
      const requesterUserId = req?.headers?.['userid'];
      console.log('[Query.bookingsByUser] Requester userId:', requesterUserId);
      console.log('[Query.bookingsByUser] Requested userId:', userId);
      if (!requesterUserId || requesterUserId !== userId) {
        console.log('[Query.bookingsByUser] Access denied: userId mismatch or missing');
        return [];
      }

      let filteredBookings = bookings.filter(b => b.userId === userId);
      console.log(`[Query.bookingsByUser] Filtered bookings:`, filteredBookings);
      return filteredBookings;
    },
  },
  Booking: {
	  hotel: (parent) => ({ id: parent.hotelId }),
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
