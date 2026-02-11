/**
 * mint.js — Mint new Pokemon NFTs.
 *
 * Usage:
 *   npx hardhat run scripts/mint.js --network sepolia --config hardhat.config.cjs
 *
 * Configure MINT_LIST below or call from another script.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ── Pokemon to mint ─────────────────────────────────────────────────────────
// species: lowercase key matching the registered evolution chain
// to:      recipient address (defaults to deployer if omitted)
// Base stats drawn from the metadata JSON files
const MINT_LIST = [
  { species: "bulbasaur", hp: 294, atk: 49, def: 49, spd: 45 },
  { species: "charmander", hp: 282, atk: 52, def: 43, spd: 65 },
  { species: "squirtle", hp: 292, atk: 48, def: 65, spd: 43 },
  { species: "pichu", hp: 274, atk: 40, def: 15, spd: 60 },
  { species: "eevee", hp: 314, atk: 55, def: 50, spd: 55 },
  { species: "machop", hp: 302, atk: 80, def: 50, spd: 35,},
  
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Load deployment info
  const deployPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deployPath)) {
    console.error("❌ deployment.json not found. Run deploy.js first.");
    process.exit(1);
  }
  const { contractAddress } = JSON.parse(fs.readFileSync(deployPath, "utf-8"));

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", contractAddress);
  console.log("Connected to PokemonNFT at:", contractAddress);
  console.log("Minting from:", deployer.address);
  console.log("");

  for (const entry of MINT_LIST) {
    const to = entry.to || deployer.address;

    console.log(`🥚 Minting ${entry.species} → ${to}`);
    const tx = await PokemonNFT.mintPokemon(
      to,
      entry.species,
      entry.hp,
      entry.atk,
      entry.def,
      entry.spd
    );
    const receipt = await tx.wait();

    // Parse the PokemonMinted event
    const iface = PokemonNFT.interface;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed && parsed.name === "PokemonMinted") {
          console.log(`  ✅ Token #${parsed.args.tokenId} minted — HP:${parsed.args.hp} ATK:${parsed.args.atk} DEF:${parsed.args.def} SPD:${parsed.args.spd}`);
        }
      } catch {}
    }
  }

  // Show token count
  const balance = await PokemonNFT.balanceOf(deployer.address);
  console.log(`\n🏆 ${deployer.address} now owns ${balance} Pokemon NFT(s)`);

  // Explicit exit to avoid UV_HANDLE_CLOSING assertion on Windows
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
