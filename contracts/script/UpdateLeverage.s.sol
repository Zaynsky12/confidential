// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IConfidentialCore {
    function updatePairLeverage(bytes32 pairId, uint256 maxLeverage_) external;
}

contract UpdateLeverage is Script {
    function run() external {
        uint256 ownerPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");
        vm.startBroadcast(ownerPrivateKey);

        IConfidentialCore core = IConfidentialCore(0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27);

        // Crypto (100x)
        core.updatePairLeverage(keccak256(abi.encodePacked("BTC/USDC")), 100);
        core.updatePairLeverage(keccak256(abi.encodePacked("ETH/USDC")), 100);

        // Crypto (50x)
        core.updatePairLeverage(keccak256(abi.encodePacked("LINK/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("ARB/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("AVAX/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("SUI/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("APT/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("NEAR/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("DOGE/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("PEPE/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("WIF/USDC")), 50);

        // RWA (50x)
        core.updatePairLeverage(keccak256(abi.encodePacked("GOLD/USDC")), 50);
        core.updatePairLeverage(keccak256(abi.encodePacked("SILVER/USDC")), 50);

        // RWA (20x)
        core.updatePairLeverage(keccak256(abi.encodePacked("AAPL/USDC")), 20);
        core.updatePairLeverage(keccak256(abi.encodePacked("TSLA/USDC")), 20);
        core.updatePairLeverage(keccak256(abi.encodePacked("NVDA/USDC")), 20);

        vm.stopBroadcast();
    }
}
