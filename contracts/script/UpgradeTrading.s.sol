// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConfidentialCore.sol";
import "../src/ConfidentialTrading.sol";

contract UpgradeTrading is Script {
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant CORE = 0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27;
    address constant VAULT = 0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE;
    address constant ORACLE = 0x897b9947185079B42d94CbbF332192CEFd9ACCFA;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ConfidentialCore core = ConfidentialCore(CORE);

        // 1. Deploy new Trading contract
        ConfidentialTrading newTrading = new ConfidentialTrading(
            USDC, CORE, VAULT, ORACLE
        );

        // 2. Point Core to the new Trading contract
        core.setTrading(address(newTrading));

        vm.stopBroadcast();
        
        // Log the new address
        console.log("New Trading Contract deployed to:", address(newTrading));
    }
}
