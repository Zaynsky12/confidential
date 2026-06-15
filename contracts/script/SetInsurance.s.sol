// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConfidentialCore.sol";

contract SetInsurance is Script {
    address constant CORE = 0x2F1f40a9aC9728B3377165fBF7520539669Ea4dA;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ConfidentialCore core = ConfidentialCore(CORE);

        // We set the insurance fund to the deployer's address (or another wallet)
        // If it's address(0), execution will revert due to rounding dust.
        core.setInsuranceFund(msg.sender);

        vm.stopBroadcast();
        
        console.log("Insurance Fund successfully set to:", msg.sender);
    }
}
