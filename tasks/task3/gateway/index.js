import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

const bookingUrl = process.env.BOOKING_URL || 'http://localhost:4001/';
const hotelUrl = process.env.HOTEL_URL || 'http://localhost:4002/';
const promoUrl = process.env.PROMO_URL || 'http://localhost:4003/';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'booking-subgraph', url: bookingUrl },
      { name: 'hotel-subgraph', url: hotelUrl },
      { name: 'promocode-subgraph', url: promoUrl },
    ],
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        const headers = context?.headers || {};
        for (const [k, v] of Object.entries(headers)) {
          if (v) request.http?.headers.set(k, v.toString());
        }
      },
    });
  },
});

const server = new ApolloServer({ gateway });

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => ({ headers: req.headers }),
}).then(() => {
  console.log('✅ Apollo Gateway ready at http://localhost:4000/');
});
