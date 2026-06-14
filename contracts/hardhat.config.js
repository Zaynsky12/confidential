import dotenv from "dotenv";
dotenv.config();

import ethersPlugin from "@nomicfoundation/hardhat-ethers";

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    arc: {
      type: "http",
      url: "https://rpc.testnet.arc.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  plugins: [ethersPlugin]
};
