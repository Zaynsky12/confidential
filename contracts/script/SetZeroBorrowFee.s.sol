// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConfidentialTrading.sol";

contract SetZeroBorrowFee is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tradingAddress = 0x788E7b0be4BaAA89143F3C14CE34A606659A306c; // V3 Trading Contract

        vm.startBroadcast(deployerPrivateKey);

        ConfidentialTrading trading = ConfidentialTrading(tradingAddress);
        
        // Set borrow fee (rollover fee) to 0
        trading.setRolloverFeePerHour(0);
        
        vm.stopBroadcast();
    }
}
