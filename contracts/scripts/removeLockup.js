import hre from "hardhat";

async function main() {
    const VAULT_ADDRESS = "0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE";

    console.log("Connecting to Vault at:", VAULT_ADDRESS);
    const vault = await hre.ethers.getContractAt("ConfidentialVault", VAULT_ADDRESS);

    console.log("Setting lockup periods to 0...");
    const tx = await vault.setTieredLockups(0, 0);
    await tx.wait();

    console.log("Lockup periods set to 0. You can now withdraw immediately!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
