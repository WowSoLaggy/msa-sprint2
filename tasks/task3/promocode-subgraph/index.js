import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.3",
      import: ["@key", "@external", "@override", "@requires"]
    )

  extend type Booking @key(fields: "id") {
    id: ID! @external
    promoCode: String @external
    discountPercent: Int!
      @override(from: "booking")
      @requires(fields: "promoCode")
  }
`;


const promos = [
  { promoCode: 'SUPER25', discount: 42 },
]

const resolvers = {
  Booking: {
    discountPercent(booking) {
      const base = booking.discountPercent ?? 0;
      const promoCode = booking.promoCode;
      console.log('[Booking.discountPercent] Promocode:', promoCode)
      console.log('[Booking.discountPercent] Base discount:', base)

      const promo = promos.find(p => p.promoCode === promoCode);
      if (promo) {
        console.log('[Booking.discountPercent] Promo discount:', promo.discount);
        return promo.discount;
      }

      return base;
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4003 },
}).then(() => {
  console.log('✅ Promocode subgraph ready at http://localhost:4003/');
});
