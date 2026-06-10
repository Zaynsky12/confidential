// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConfidentialCore.sol";
import "../src/ConfidentialTrading.sol";

contract UpgradeTrading is Script {
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant CORE = 0x2F1f40a9aC9728B3377165fBF7520539669Ea4dA;
    address constant VAULT = 0x7AAB49563A2DD6e3320ae98DBe22444bd65Bc84f;
    address constant ORACLE = 0x2138f5930b60a6011b3eDD57461D1023311d0D17;

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
