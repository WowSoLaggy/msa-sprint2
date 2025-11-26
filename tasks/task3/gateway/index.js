import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';

// Сборка суперсхемы из двух подграфов
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'booking', url: process.env.BOOKING_URL || 'http://localhost:4001/' },
      { name: 'hotel', url: process.env.HOTEL_URL || 'http://localhost:4002/' },
    ],
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      // Проксируем все входящие заголовки (включая userId) в подграфы
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
