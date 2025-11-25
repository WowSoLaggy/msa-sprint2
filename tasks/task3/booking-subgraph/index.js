import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
  type Booking @key(fields: "id") {
    id: ID!
    userId: String!
    hotelId: String!
    promoCode: String
    discountPercent: Int
  }

  type Query {
    bookingsByUser(userId: String!): [Booking]
  }
`;

// Общая заглушка
function getStubBooking(userId, id = 'b1') {
  return {
    id,
    userId,
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
      return [getStubBooking(userId)];
    },
  },
  Booking: {
    // Федеративный резолвер для ссылки на Booking по id
    __resolveReference: async (reference, { req }) => {
      const requesterUserId = req?.headers?.['userid'];
      if (!requesterUserId) {
        return null;
      }

      // TODO: заменить заглушку на реальный источник по reference.id
      const booking = getStubBooking(requesterUserId, reference?.id ?? 'b1');

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
