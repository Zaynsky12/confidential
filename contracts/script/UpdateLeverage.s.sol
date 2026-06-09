// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ConfidentialCore.sol";

contract UpdateLeverageScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Arc Testnet Core address
        ConfidentialCore core = ConfidentialCore(0x769c307CA53c2b84DecEA5b2a6F45304Cd7785CB);

        bytes32 goldPairId = keccak256(abi.encodePacked("GOLD/USDC"));
        bytes32 silverPairId = keccak256(abi.encodePacked("SILVER/USDC"));

        core.updatePairLeverage(goldPairId, 100);
        core.updatePairLeverage(silverPairId, 100);

        vm.stopBroadcast();
    }
}
