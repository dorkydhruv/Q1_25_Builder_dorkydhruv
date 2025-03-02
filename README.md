# Howdy! `Turbin3 Q1 2025`

This codebase contains all the programs I built during Turbin3 Q1 2025. Each project is organized in its own subdirectory:

## Projects

- `/amm` - Automatic Market Maker to swap two tokens while maintaing a constant product.
- `/dice-game` - Game contract for betting on a dice roll, _revisit_ for instructions.
- `/escrow` - Simple escrow implementation.
- `/marketplace` - NFT marketplace, to sell NFT by naming your price. ✔<b>TESTED</b>
- `/nft-staking` - Stake NFT for rewards based on staking period. Can be implemented for fungible tokens as well. ✔<b>TESTED</b>
- `/solana-starter` - Pre-requisite for Q1 2025
- `/vault` - Very simple vault implementation. ✔<b>TESTED</b>

## Structure

Each project folder contains:

- Program logic in `/programs`
- Tests in `/tests`

## Getting Started

1. Make sure you have Anchor framework installed
2. Clone this repository
3. Navigate to any project directory
4. Run `anchor build` and `anchor test`

Feel free to explore each project's individual README (if there is one XD) for specific details.

# Capstone (DMANDATE) `/dmandate`

DMANDATE is a Solana-based protocol for decentralized recurring payments. Users pre-approve a PDA to transfer tokens (e.g., USDC) without locking funds. A backend processes payments at scheduled intervals, ensuring self-custody and transparency. Ideal for subscriptions, salaries, and bills, DMANDATE offers a trustless, non-custodial alternative to traditional e-mandates.

![REPO](https://github.com/dorkydhruv/dmandate)
