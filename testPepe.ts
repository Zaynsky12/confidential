import { gqlClient } from "./src/config/graphql.ts";
import { gql } from "graphql-request";

async function run() {
  const query = gql`{ positions(first: 5, orderBy: openedAt, orderDirection: desc) { id trader pairId sizeUsd leverage entryPrice isLong } }`;
  const data: any = await gqlClient.request(query);
  console.log(JSON.stringify(data, null, 2));
}
run();
