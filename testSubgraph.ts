import { gqlClient } from "./src/config/graphql.ts";
import { gql } from "graphql-request";

const query = gql`
  {
    positions(where: { isOpen: true }) {
      id
      trader
      sizeUsd
      leverage
      collateral
    }
  }
`;

gqlClient.request(query).then(console.log).catch(console.error);
