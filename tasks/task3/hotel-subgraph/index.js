import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    stars: Int
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]
  }
`;

const hotels = [
  { id: 'h1', name: 'Grand Hotel', city: 'New York', stars: 5 },
  { id: 'h2', name: 'Budget Inn', city: 'Los Angeles', stars: 3 },
  { id: 'h3', name: 'Sea View Resort', city: 'Miami', stars: 4 },
]

const resolvers = {
  Hotel: {
    __resolveReference: async ({ id }) => {
      console.log('[Hotel.__resolveReference] id:', id);
      const hotel = hotels.find(h => h.id === id);
      console.log('[Hotel.__resolveReference] found hotel:', hotel);
      return hotel;
    },
  },
  Query: {
    hotelsByIds: async (_, { ids }) => {
      // TODO: Заглушка или REST-запрос
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4002 },
}).then(() => {
  console.log('✅ Hotel subgraph ready at http://localhost:4002/');
});
