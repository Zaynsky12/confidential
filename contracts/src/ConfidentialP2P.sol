// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ReentrancyGuard.sol";
import "./ConfidentialCore.sol";
import "./ConfidentialTrading.sol";

contract ConfidentialP2P is ReentrancyGuard {
    ConfidentialCore public core;
    ConfidentialTrading public trading;

    mapping(address => uint256) public nonces;

    bytes32 public constant ORDER_TYPEHASH = keccak256("Order(address trader,bytes32 pairId,bool isLong,uint256 sizeUsd,uint256 collateral,uint256 price,uint256 nonce,uint256 expiry)");

    constructor(address _core, address payable _trading) {
        core = ConfidentialCore(_core);
        trading = ConfidentialTrading(_trading);
    }

    // ═══════════════════════════════════════════════════════
    //  FIX CRITICAL-1: Domain now uses "Confidential DEX" 
    //  and address(this) to match Frontend EIP-712
    // ═══════════════════════════════════════════════════════
    function getDomainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Confidential DEX")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    struct OrderInfo {
        address trader;
        bytes32 pairId;
        bool isLong;
        uint256 sizeUsd;
        uint256 collateral;
        uint256 price;
        uint256 nonce;
        uint256 expiry;
    }

    // ═══════════════════════════════════════════════════════
    //  FIX CRITICAL-3: Allow traders to cancel off-chain
    //  orders by incrementing their nonce on-chain
    // ═══════════════════════════════════════════════════════
    function cancelP2POrder() external {
        nonces[msg.sender]++;
    }

    function settleP2PTrade(
        bytes calldata makerPayload,
        bytes calldata takerPayload,
        bytes calldata makerSig,
        bytes calldata takerSig,
        uint256 matchPrice
    ) external nonReentrant {
        require(msg.sender == core.keeper(), "Only Keeper can settle P2P");

        OrderInfo memory maker = abi.decode(makerPayload, (OrderInfo));
        OrderInfo memory taker = abi.decode(takerPayload, (OrderInfo));

        require(maker.pairId == taker.pairId, "Pair mismatch");
        require(maker.isLong != taker.isLong, "Direction mismatch");
        require(maker.sizeUsd == taker.sizeUsd, "Size mismatch");

        _verifySig(maker, makerSig);
        _verifySig(taker, takerSig);

        // ═══════════════════════════════════════════════════════
        //  FIX HIGH-2: Validate matchPrice against Pyth Oracle
        //  Keeper cannot deviate more than 1% from oracle price
        // ═══════════════════════════════════════════════════════
        PythPriceOracle oracle = trading.oracle();
        (uint256 oraclePrice, ) = oracle.getPrice(maker.pairId);
        require(
            matchPrice >= (oraclePrice * 99) / 100 && matchPrice <= (oraclePrice * 101) / 100,
            "Match price deviates from oracle"
        );

        // FIX HIGH-3: Maker pays maker fee (0.02%), Taker pays taker fee (0.04%)
        trading.executeP2POpen(maker.trader, maker.pairId, maker.isLong, maker.sizeUsd, maker.collateral, matchPrice, true);
        trading.executeP2POpen(taker.trader, taker.pairId, taker.isLong, taker.sizeUsd, taker.collateral, matchPrice, false);
    }

    function _verifySig(OrderInfo memory info, bytes calldata signature) internal {
        require(block.timestamp <= info.expiry, "Order expired");
        require(info.nonce == nonces[info.trader]++, "Invalid nonce");

        bytes32 structHash = keccak256(abi.encode(
            ORDER_TYPEHASH,
            info.trader,
            info.pairId,
            info.isLong,
            info.sizeUsd,
            info.collateral,
            info.price,
            info.nonce,
            info.expiry
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", getDomainSeparator(), structHash));
        address recovered = _recoverSigner(digest, signature);

        // FIX HIGH-1: Ensure ecrecover does not return address(0)
        require(recovered != address(0), "Zero address recovery");
        require(recovered == info.trader, "Invalid signature");
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature v value");
        return ecrecover(digest, v, r, s);
    }
}
