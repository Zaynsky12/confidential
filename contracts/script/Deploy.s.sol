// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DeployConfidential — Deployment script for all Confidential DEX contracts
/// @notice Run with: forge script script/Deploy.s.sol --rpc-url $ARC_TESTNET_RPC_URL --private-key $PRIVATE_KEY --broadcast

import "forge-std/Script.sol";
import "../src/PythPriceOracle.sol";
import "../src/ConfidentialCore.sol";
import "../src/ConfidentialVault.sol";
import "../src/ConfidentialTrading.sol";

contract DeployConfidential is Script {
    // Arc Testnet USDC
    address constant USDC = 0x3600000000000000000000000000000000000000;
    
    // Pyth contract address on Arc Testnet
    address constant PYTH = 0xACeA761c27A909d4D3895128EBe6370FDE2dF481;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        // 1. Deploy Oracle
        PythPriceOracle oracle = new PythPriceOracle(PYTH);

        // 2. Deploy Core
        ConfidentialCore core = new ConfidentialCore(USDC, address(oracle));

        // 3. Deploy Vault
        ConfidentialVault vault = new ConfidentialVault(USDC, address(core));

        // 4. Deploy Trading
        ConfidentialTrading trading = new ConfidentialTrading(
            USDC, address(core), address(vault), address(oracle)
        );

        // 5. Wire up contracts
        core.setVault(address(vault));
        core.setTrading(address(trading));
        core.setTreasury(msg.sender);      // Dev wallet = treasury for now
        core.setInsuranceFund(msg.sender);  // Dev wallet = insurance for now

        // 6. Register trading pairs

        // ── Crypto (max 50x leverage) ──
        _addPair(core, oracle, "BTC/USDC",   0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43, 50, 5_000_000e6, 5_000_000e6);
        _addPair(core, oracle, "ETH/USDC",   0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, 50, 3_000_000e6, 3_000_000e6);
        _addPair(core, oracle, "SOL/USDC",   0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d, 50, 1_000_000e6, 1_000_000e6);
        _addPair(core, oracle, "BNB/USDC",   0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f, 50, 1_000_000e6, 1_000_000e6);
        _addPair(core, oracle, "XRP/USDC",   0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8, 50, 1_000_000e6, 1_000_000e6);
        _addPair(core, oracle, "LINK/USDC",  0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221, 25, 500_000e6, 500_000e6);
        _addPair(core, oracle, "ARB/USDC",   0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5, 25, 250_000e6, 250_000e6);
        _addPair(core, oracle, "AVAX/USDC",  0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7, 25, 500_000e6, 500_000e6);
        _addPair(core, oracle, "SUI/USDC",   0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744, 25, 250_000e6, 250_000e6);
        _addPair(core, oracle, "APT/USDC",   0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5, 25, 250_000e6, 250_000e6);
        _addPair(core, oracle, "NEAR/USDC",  0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750, 25, 250_000e6, 250_000e6);
        _addPair(core, oracle, "DOGE/USDC",  0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c, 20, 200_000e6, 200_000e6);
        _addPair(core, oracle, "PEPE/USDC",  0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4, 10, 100_000e6, 100_000e6);
        _addPair(core, oracle, "WIF/USDC",   0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc, 10, 100_000e6, 100_000e6);

        // ── RWA (max 10x leverage) ──
        _addPair(core, oracle, "AAPL/USDC",  0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688, 10, 500_000e6, 500_000e6);
        _addPair(core, oracle, "TSLA/USDC",  0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1, 10, 500_000e6, 500_000e6);
        _addPair(core, oracle, "GOLD/USDC",  0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2, 10, 1_000_000e6, 1_000_000e6);
        _addPair(core, oracle, "SILVER/USDC",0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e, 10, 500_000e6, 500_000e6);
        _addPair(core, oracle, "SPY/USDC",   0x19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5, 10, 500_000e6, 500_000e6);
        _addPair(core, oracle, "NVDA/USDC",  0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593, 10, 500_000e6, 500_000e6);

        // ── Forex (max 100x leverage) ──
        _addPair(core, oracle, "EUR/USDC",   0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b, 100, 2_000_000e6, 2_000_000e6);
        _addPair(core, oracle, "GBP/USDC",   0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1, 100, 2_000_000e6, 2_000_000e6);
        _addPair(core, oracle, "USDJPY/USDC",0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52, 100, 2_000_000e6, 2_000_000e6);
        
        vm.stopBroadcast();
    }

    function _addPair(
        ConfidentialCore core,
        PythPriceOracle oracle,
        string memory name,
        bytes32 pythFeedId,
        uint256 maxLev,
        uint256 maxLong,
        uint256 maxShort
    ) internal {
        core.addPair(name, pythFeedId, maxLev, maxLong, maxShort, 2000); // 2000 bps = 20% max per user
        bytes32 pairId = keccak256(abi.encodePacked(name));
        oracle.setPriceFeed(pairId, pythFeedId);
    }
}
