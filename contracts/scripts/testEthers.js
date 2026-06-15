import hre from "hardhat";

async function main() {
  console.log("hre.ethers is:", typeof hre.ethers);
  if (hre.ethers) {
    console.log("ethers is defined!");
  } else {
    console.log("ethers is undefined!");
  }
}

main().catch(console.error);
