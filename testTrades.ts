import { gqlClient } from "./src/config/graphql.ts";
import { gql } from "graphql-request";

async function run() {
  const allQuery = gql`{ tradeRecords { id trader sizeUsd } }`;
  const allData: any = await gqlClient.request(allQuery);
  const allVol = allData.tradeRecords.reduce((sum: number, t: any) => sum + Number(t.sizeUsd), 0) / 1e6;
  
  const userQuery = gql`{ tradeRecords(where: { trader: "0x3190e3b097fac3579fb8817c4e8e094aa58b354a" }) { id trader sizeUsd } }`;
  const userData: any = await gqlClient.request(userQuery);
  const userVol = userData.tradeRecords.reduce((sum: number, t: any) => sum + Number(t.sizeUsd), 0) / 1e6;
  
  console.log({ allVol, userVol, allCount: allData.tradeRecords.length, userCount: userData.tradeRecords.length });
}
run();
