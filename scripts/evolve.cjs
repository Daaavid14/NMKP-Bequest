/**
 * evolve.js — Evolve Pokemon NFTs that have reached the required level.
 *
 * Usage:
 *   npx hardhat run scripts/evolve.js --network sepolia --config hardhat.config.cjs
 *
 * Configure TOKEN_IDS below.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ── Tokens to attempt evolution on ──────────────────────────────────────────
const TOKEN_IDS = [1, 2];

const STAGE_NAMES = ["BaseForm", "SecondForm", "ThirdForm"];

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const deployPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deployPath)) {
    console.error("❌ deployment.json not found. Run deploy.js first.");
    process.exit(1);
  }
  const { contractAddress } = JSON.parse(fs.readFileSync(deployPath, "utf-8"));

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", contractAddress);
  console.log("Connected to PokemonNFT at:", contractAddress);
  console.log("");

  for (const tokenId of TOKEN_IDS) {
    const [species, level, experience, stage] = await PokemonNFT.getPokemon(tokenId);
    console.log(
      `🔍 Token #${tokenId}: ${species} | Lv.${level} | ${STAGE_NAMES[Number(stage)]} | EXP: ${experience}`
    );

    const [canEvolveNow, requiredLevel] = await PokemonNFT.canEvolve(tokenId);

    if (!canEvolveNow) {
      if (Number(stage) === 2) {
        console.log(`   ⭐ Already fully evolved!\n`);
      } else {
        console.log(`   ⏳ Needs Lv.${requiredLevel} to evolve (currently Lv.${level})\n`);
      }
      continue;
    }

    console.log(`   🧬 Evolving...`);
    const tx = await PokemonNFT.evolvePokemon(tokenId);
    const receipt = await tx.wait();

    // Parse Evolved event
    const iface = PokemonNFT.interface;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed && parsed.name === "Evolved") {
          console.log(
            `   ✅ ${parsed.args.fromSpecies} → ${parsed.args.toSpecies} (${STAGE_NAMES[Number(parsed.args.newStage)]})` +
            `\n   📊 HP:${parsed.args.hp} ATK:${parsed.args.atk} DEF:${parsed.args.def} SPD:${parsed.args.spd}`
          );
        }
      } catch {}
    }

    // Show new tokenURI
    const uri = await PokemonNFT.tokenURI(tokenId);
    console.log(`   🔗 New tokenURI: ${uri}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
