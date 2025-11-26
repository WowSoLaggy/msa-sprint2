import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'booking', url: 'http://booking-subgraph:4001' },
      { name: 'hotel', url: 'http://hotel-subgraph:4002' },
      { name: 'promocode', url: 'http://promocode-subgraph:4003' },
    ],
    pollIntervalInMs: 30000
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        const headers = context.req?.headers || {};
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' && !request.http.headers.has(key)) {
            request.http.headers.set(key, value);
          }
        }
      }
    });
  }
});

const server = new ApolloServer({ gateway });

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => ({ req }) // req.headers now available in willSendRequest
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});