/**
 * grant-xp.js — Grant experience to Pokemon NFTs.
 *
 * Usage:
 *   npx hardhat run scripts/grant-xp.js --network sepolia --config hardhat.config.cjs
 *
 * Configure XP_GRANTS below.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ── Experience grants ───────────────────────────────────────────────────────
// tokenId: the NFT token ID
// exp:     amount of experience to grant
const XP_GRANTS = [
  { tokenId: 1, exp: 1500 },  // Enough for level 16 (base → second evolution)
  { tokenId: 2, exp: 3100 },  // Enough for level 32 (ready for third evolution)
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
  console.log("");

  for (const grant of XP_GRANTS) {
    console.log(`⚡ Granting ${grant.exp} EXP to Token #${grant.tokenId}...`);

    // Show before state
    const [species, levelBefore] = await PokemonNFT.getPokemon(grant.tokenId);
    console.log(`   Before: ${species} Lv.${levelBefore}`);

    const tx = await PokemonNFT.grantExperience(grant.tokenId, grant.exp);
    const receipt = await tx.wait();

    // Parse events
    const iface = PokemonNFT.interface;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed && parsed.name === "LevelUp") {
          console.log(
            `   📈 Level Up! Lv.${parsed.args.oldLevel} → Lv.${parsed.args.newLevel}` +
            ` | HP:${parsed.args.hp} ATK:${parsed.args.atk} DEF:${parsed.args.def} SPD:${parsed.args.spd}`
          );
        }
        if (parsed && parsed.name === "ExperienceGained") {
          console.log(
            `   ✅ +${parsed.args.expGained} EXP (total: ${parsed.args.totalExp}, Lv.${parsed.args.newLevel})`
          );
        }
      } catch {}
    }

    // Check evolution eligibility
    const [canEvolveNow, requiredLevel] = await PokemonNFT.canEvolve(grant.tokenId);
    if (canEvolveNow) {
      console.log(`   🌟 Ready to evolve! (required Lv.${requiredLevel})`);
    }

    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
