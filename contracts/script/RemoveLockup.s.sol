// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConfidentialVault.sol";

contract RemoveLockup is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = 0x3a9e038bB29C2d8dc13891639b444a80B8F57952;

        vm.startBroadcast(deployerPrivateKey);

        ConfidentialVault vault = ConfidentialVault(vaultAddress);
        
        // Remove lockup periods (set to 0 seconds)
        vault.setTieredLockups(0, 0);
        
        vm.stopBroadcast();
    }
}
