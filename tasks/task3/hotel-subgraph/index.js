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

function getStubHotel(id) {
  return {
    id,
    name: `Hotel ${id}`,
    city: 'Sample City',
    stars: 4,
  };
}

const resolvers = {
  Hotel: {
    __resolveReference: async ({ id }) => {
      return getStubHotel(id);
    },
  },
  Query: {
    hotelsByIds: async (_, { ids }) => {
      return ids.map(getStubHotel);
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
