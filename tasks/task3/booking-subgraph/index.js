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
      // ACL: разрешаем только запросы самого пользователя
      const requesterUserId = req?.headers?.['userid'];
      if (!requesterUserId || requesterUserId !== userId) {
        return [];
      }

      // TODO: заменить заглушку на реальный источник (DB/REST/gRPC)
      return [getStubBooking()];
    },
  },
  Booking: {
    hotel: (parent) => ({ id: parent.hotelId }),
    // Федеративный резолвер для ссылки на Booking по id
    __resolveReference: async (reference, { req }) => {
      const requesterUserId = req?.headers?.['userid'];
      if (!requesterUserId) {
        return null;
      }

      // TODO: заменить заглушку на реальный источник по reference.id
      const booking = getStubBooking(reference?.id ?? 'b1');

      // ACL: возвращаем только если запись принадлежит пользователю
      if (booking.userId !== requesterUserId) {
        return null;
      }
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
