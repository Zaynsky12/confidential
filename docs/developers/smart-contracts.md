# 📜 Smart Contracts

To ensure transparency and facilitate public audits by developers, we have outlined the contract layers that form the **Confidential DEX V1** network.

---

## Cryptographic Security Layers (Anti-Exploit)

Our Smart Contracts are not written arbitrarily. Every line is battle-tested against various types of threats:

- **Strict CEI (Checks-Effects-Interactions):** All token transfers (USDC) are executed purely at the end of the function block after internal ledgers have been updated. This classic design pattern closes all vulnerabilities to the *Reentrancy Attacks* rampant in DeFi.
- **Anti-Donation Attack (ERC-4626 standard):** In accordance with the standard, the first deposit coin in the Vault (worth 1000 wei) is quietly burned. This chokes exploits where hackers attempt to artificially inflate the unit price (*shares*) through massive donations prior to a hack.
- **2-Step Ownership Transfer:** The administration system does not recognize unilateral transfers. When replacing the protocol Admin/Owner, a *transferOwnership* call must always be followed by an *acceptOwnership* interaction from the receiving party. The system will never be paralyzed due to a "typo" in the wallet address (Fat-Finger Error).
- **Automated Epoch Bankruptcy:** LPs do not inherit the "debt" of a price collapse. If a Vault is depleted to a $0 balance due to consecutive trader winnings, the shares will not sink into negative value. The system will purely reset the price to a `1:1` ratio in a fresh *Epoch* cycle.

---

## 🔗 Contract Addresses (Arc Testnet)

Below are the primary smart contract addresses deployed on the Arc Testnet.

::: tip Integration Note
Use these addresses if you wish to build an *analytics dashboard*, quantitative bots, or extensions on top of our protocol.
:::

| Contract Module | Address | Details / Description |
| :--- | :--- | :--- |
| **Confidential Core V1** | *`0x31fCE291cd6b8d73617822cdB49bF9859E2dff1E`* | The brain of the protocol. Manages Open Interest, Limits, and global DEX parameters. |
| **Confidential Trading V1** | *`0x23974a61b6cEc2fC2e731973BF95538315EB230B`* | The execution gateway. Where orders are created, Pyth is validated, and leverage is calculated. |
| **Confidential Vault V1** | *`0x21996fe6f66b62B86E01Dc925fb3b02d20c85e18`* | Dual-Tranche liquidity reserve (Degen & Prime) with epoch bankruptcy protection. |
| **USDC Token (Arc)** | *`0x3600000000000000000000000000000000000000`* | The base stablecoin (Decimals: 6) on the Arc network for margin and liquidity. |
| **Pyth Price Oracle** | *`0x897b9947185079B42d94CbbF332192CEFd9ACCFA`* | High-resolution on-chain decentralized oracle validation. |

---

> Contact our team at the official repository [Zaynsky12/arctrade](https://github.com/Zaynsky12/arctrade) if you detect a potential bug or wish to perform a deep integration!
