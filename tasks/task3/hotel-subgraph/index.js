import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import DataLoader from 'dataloader';

const typeDefs = gql`
  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    stars: Int
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]!
  }
`;

const hotels = [
  { id: 'h1', name: 'Grand Hotel', city: 'New York', stars: 5 },
  { id: 'h2', name: 'Budget Inn', city: 'Los Angeles', stars: 3 },
  { id: 'h3', name: 'Sea View Resort', city: 'Miami', stars: 4 },
]

const resolvers = {
  Hotel: {
    __resolveReference: async ({ id }, { hotelLoader }) => {
      console.log('[Hotel.__resolveReference] load id:', id);
      return hotelLoader.load(id);
    },
  },
  Query: {
    hotelsByIds: async (_, { ids }, { hotelLoader }) => {
      console.log('[Query.hotelsByIds] requested ids:', ids);
      return hotelLoader.loadMany(ids);
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4002 },
  context: async () => {
    const hotelLoader = new DataLoader(async (ids) => {
      console.log('[DataLoader.batch] ids:', ids);
      // Preserve order: map each id to its hotel (or null if not found)
      return ids.map(id => hotels.find(h => h.id === id) || null);
    }, { cache: true });
    return { hotelLoader };
  },
}).then(() => {
  console.log('✅ Hotel subgraph ready at http://localhost:4002/');
});
