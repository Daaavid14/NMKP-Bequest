# NOMEKOP Bequest — Blockchain Deployment Guide

## Architecture Overview

```
PokemonNFT (ERC-721)
├── Minting        — Owner mints base-form Pokemon with on-chain stats
├── Experience     — Game operators grant EXP; auto-leveling (100 EXP = 1 level)
├── Evolution      — baseForm → secondForm (Lv.16) → thirdForm (Lv.32)
├── Stats          — HP +5, ATK +3, DEF +2, SPD +2 per level; +20/10/10/10 on evo
└── Metadata       — Dynamic tokenURI updates to new IPFS CID on evolution
```

---

## Prerequisites

| Item | Where to get it |
|---|---|
| **Node.js ≥ 18** | https://nodejs.org |
| **MetaMask wallet** | https://metamask.io — export private key |
| **Sepolia ETH** | https://sepoliafaucet.com or https://faucet.sepolia.dev |
| **Infura / Alchemy RPC URL** | https://infura.io or https://alchemy.com |
| **Etherscan API key** | https://etherscan.io/myapikey |

---

## 1. Environment Setup

```bash
# Install dependencies (already done if you followed main README)
npm install

# Copy environment template and fill in your values
cp .env.example .env
```

Edit `.env`:
```env
DEPLOYER_PRIVATE_KEY=abc123...          # MetaMask → Account details → Export private key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

---

## 2. Compile & Test Locally

```bash
# Compile the smart contract
npm run compile

# Run the full test suite (24 tests)
npm run test
```

All tests should pass:
- Deployment, minting, experience/leveling, evolution, game operators, view functions.

---

## 3. Test on Local Hardhat Node (optional)

```bash
# Terminal 1 — start a local blockchain
npm run node

# Terminal 2 — deploy, mint, grant XP, evolve, query
npm run deploy:local
npm run mint:local
npm run xp:local
npm run evolve:local
npm run query:local
```

---

## 4. Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

This will:
1. Deploy `PokemonNFT` contract
2. Register all 20 evolution chains from `metadata/cids.json`
3. Attempt Etherscan verification (waits 30 s for indexing)
4. Save contract address to `deployment.json`

If verification fails, run manually:
```bash
npx hardhat verify --network sepolia --config hardhat.config.cjs <CONTRACT_ADDRESS> "<YOUR_DEPLOYER_ADDRESS>"
```

---

## 5. Mint Pokemon

Edit the `MINT_LIST` array in `scripts/mint.cjs` to choose which Pokemon + stats to mint, then:

```bash
npm run mint:sepolia
```

Each mint creates a Lv.1 base-form Pokemon with the IPFS metadata CID as its tokenURI.

---

## 6. Grant Experience

Edit the `XP_GRANTS` array in `scripts/grant-xp.cjs`:

```js
const XP_GRANTS = [
  { tokenId: 1, exp: 1500 },  // → Level 16 (ready for first evolution)
  { tokenId: 2, exp: 3100 },  // → Level 32 (ready for final evolution)
];
```

```bash
npm run xp:sepolia
```

---

## 7. Evolve Pokemon

Edit the `TOKEN_IDS` array in `scripts/evolve.cjs`:

```bash
npm run evolve:sepolia
```

The script checks eligibility, evolves, and prints the new species name, stats, and tokenURI.

---

## 8. Query Pokemon

```bash
npm run query:sepolia

# Or query specific tokens:
TOKEN_IDS=1,3,5 npx hardhat run scripts/query.cjs --network sepolia --config hardhat.config.cjs
```

---

## Smart Contract API Reference

### Admin Functions (owner only)
| Function | Description |
|---|---|
| `mintPokemon(to, species, hp, atk, def_, spd)` | Mint a new base-form Pokemon |
| `registerEvolutionChain(base, second, third, baseCID, secondCID, thirdCID)` | Register species CIDs |
| `setGameOperator(address, bool)` | Grant/revoke game operator role |

### Game Operator Functions
| Function | Description |
|---|---|
| `grantExperience(tokenId, amount)` | Grant EXP (auto-levels, auto-stat-gains) |

### Player / Public Functions
| Function | Description |
|---|---|
| `evolvePokemon(tokenId)` | Evolve (must be token owner, operator, or contract owner) |
| `getPokemon(tokenId)` | Returns species, level, exp, stage, hp, atk, def, spd |
| `getStats(tokenId)` | Returns hp, atk, def, spd |
| `getLevelAndExp(tokenId)` | Returns level, totalExp, expToNextLevel |
| `canEvolve(tokenId)` | Returns (bool canEvolve, uint16 requiredLevel) |
| `getEvolutionChainCIDs(baseSpecies)` | Returns base/second/third CIDs |

### Events
| Event | Emitted when |
|---|---|
| `PokemonMinted` | A new Pokemon is minted |
| `ExperienceGained` | EXP is granted |
| `LevelUp` | A Pokemon levels up |
| `Evolved` | A Pokemon evolves |
| `EvolutionChainRegistered` | A new chain is registered |
| `GameOperatorUpdated` | Operator role changes |

---

## Evolution Mechanics

| Stage | Level Required | Species Example |
|---|---|---|
| BaseForm | — | Bulbasaur |
| SecondForm | 16 | Ivysaur |
| ThirdForm | 32 | Venasaur |

**Per-level stat gains:** HP +5, ATK +3, DEF +2, SPD +2  
**Evolution bonus (flat):** HP +20, ATK +10, DEF +10, SPD +10

---

## NPM Scripts Reference

| Command | Description |
|---|---|
| `npm run compile` | Compile Solidity contracts |
| `npm run test` | Run test suite |
| `npm run node` | Start local Hardhat node |
| `npm run deploy:local` | Deploy to local node |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run mint:local / mint:sepolia` | Mint Pokemon |
| `npm run xp:local / xp:sepolia` | Grant experience |
| `npm run evolve:local / evolve:sepolia` | Evolve Pokemon |
| `npm run query:local / query:sepolia` | Query Pokemon stats |

---

## Registered Evolution Chains (20 total)

All chains are auto-registered during deployment from `metadata/cids.json`:

| Base | Second | Third |
|---|---|---|
| Bulbasaur | Ivysaur | Venasaur |
| Charmander | Charmeleon | Charizard |
| Squirtle | Wartortle | Blastoise |
| Caterpie | Metapod | Butterfree |
| Weedle | Kakuna | Beedrill |
| Pidgey | Pidgeotto | Pidgeot |
| Pichu | Pikachu | Raichu |
| Machop | Machoke | Machamp |
| Ghastly | Haunter | Gengar |
| Dratini | Dragonair | Dragonite |
| Eevee | Flareon | Jolteon |
| Elekid | Electabuzz | Electivire |
| Magby | Magmar | Magmortar |
| Horsea | Seadra | Kingdra |
| Larvitar | Pupitar | Tyranitar |
| Cyndaquil | Quilava | Typhlosion |
| Totodile | Croconaw | Feraligatr |
| Torchic | Combusken | Blaziken |
| Swinub | Piloswine | Mamoswine |
| Whismur | Loudred | Exploud |
