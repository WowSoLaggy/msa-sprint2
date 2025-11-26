import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import gql from "graphql-tag";

const typeDefs = gql`
  extend type Booking @key(fields: "id") {
    id: ID! @external
    promoCode: String @external
  }

  type DiscountInfo {
    isValid: Boolean!
    originalDiscount: Float!
    finalDiscount: Float!
    description: String
    expiresAt: String
    applicableHotels: [ID!]!
  }

  type Query {
    validatePromoCode(code: String!, hotelId: ID): DiscountInfo!
    activePromoCodes: [DiscountInfo!]!
  }
`;

// Simplified promo logic: a tiny lookup by code, ignore hotel rules
function applyPromo(code, originalDiscount = 0) {
  const promos = {
    SUPER25: { percent: 25, description: "Super promo 25%", expiresAt: "2030-01-01" },
    HOTEL10: { percent: 10, description: "Hotel special 10%", expiresAt: "2030-01-01" }
  };

  if (!code) {
    return {
      isValid: false,
      originalDiscount,
      finalDiscount: originalDiscount,
      description: "No promo code",
      expiresAt: null,
      applicableHotels: []
    };
  }

  const p = promos[code.toUpperCase()];
  if (!p) {
    return {
      isValid: false,
      originalDiscount,
      finalDiscount: originalDiscount,
      description: "Invalid promo code",
      expiresAt: null,
      applicableHotels: []
    };
  }

  return {
    isValid: true,
    originalDiscount,
    finalDiscount: Math.max(originalDiscount, p.percent),
    description: p.description,
    expiresAt: p.expiresAt,
    applicableHotels: [] // keep empty for simplicity
  };
}

const resolvers = {
  Booking: {
    // We override discountPercent with our simple rule
    discountPercent(booking) {
      const base = booking.discountPercent ?? 0;
      return applyPromo(booking.promoCode, base).finalDiscount;
    },
    discountInfo(booking) {
      const base = booking.discountPercent ?? 0;
      return applyPromo(booking.promoCode, base);
    }
  },
  Query: {
    validatePromoCode(_, { code }) {
      return applyPromo(code, 0);
    },
    activePromoCodes() {
      return [
        { isValid: true, originalDiscount: 0, finalDiscount: 25, description: "Super promo 25%", expiresAt: "2030-01-01", applicableHotels: [] },
        { isValid: true, originalDiscount: 0, finalDiscount: 10, description: "Hotel special 10%", expiresAt: "2030-01-01", applicableHotels: [] }
      ];
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

const port = Number(process.env.PORT ?? 4003);

const { url } = await startStandaloneServer(server, {
  listen: { port }
});

console.log(`promocode-subgraph ready at ${url}`);