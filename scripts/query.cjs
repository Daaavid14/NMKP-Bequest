/**
 * query.js — Query on-chain Pokemon data for any token.
 *
 * Usage:
 *   npx hardhat run scripts/query.js --network sepolia --config hardhat.config.cjs
 *
 * Configure TOKEN_IDS below, or pass as env: TOKEN_IDS=1,2,3
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const TOKEN_IDS = process.env.TOKEN_IDS
  ? process.env.TOKEN_IDS.split(",").map(Number)
  : [1, 2, 3, 4, 5];

const STAGE_NAMES = ["BaseForm", "SecondForm", "ThirdForm"];

async function main() {
  const deployPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deployPath)) {
    console.error("❌ deployment.json not found. Run deploy.js first.");
    process.exit(1);
  }
  const { contractAddress } = JSON.parse(fs.readFileSync(deployPath, "utf-8"));

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", contractAddress);
  console.log("Connected to PokemonNFT at:", contractAddress);

  const totalSupply = await PokemonNFT.totalSupply();
  console.log(`Total supply: ${totalSupply} Pokemon\n`);
  console.log("═".repeat(70));

  for (const tokenId of TOKEN_IDS) {
    try {
      const [species, level, experience, stage, hp, atk, def_, spd] =
        await PokemonNFT.getPokemon(tokenId);
      const [, , expToNext] = await PokemonNFT.getLevelAndExp(tokenId);
      const [canEvolveNow, requiredLevel] = await PokemonNFT.canEvolve(tokenId);
      const uri = await PokemonNFT.tokenURI(tokenId);
      const owner = await PokemonNFT.ownerOf(tokenId);

      console.log(`\n🎴 Token #${tokenId}: ${species}`);
      console.log(`   Owner:     ${owner}`);
      console.log(`   Stage:     ${STAGE_NAMES[Number(stage)]}`);
      console.log(`   Level:     ${level}`);
      console.log(`   EXP:       ${experience} (${expToNext} to next level)`);
      console.log(`   ─── Stats ───`);
      console.log(`   HP:  ${hp}`);
      console.log(`   ATK: ${atk}`);
      console.log(`   DEF: ${def_}`);
      console.log(`   SPD: ${spd}`);
      console.log(`   ─── Metadata ───`);
      console.log(`   URI: ${uri}`);
      if (canEvolveNow) {
        console.log(`   🌟 READY TO EVOLVE (requires Lv.${requiredLevel})`);
      } else if (Number(stage) < 2) {
        console.log(`   ⏳ Evolves at Lv.${requiredLevel}`);
      } else {
        console.log(`   ⭐ Fully evolved`);
      }
    } catch (err) {
      console.log(`\n❌ Token #${tokenId}: ${err.message.slice(0, 80)}`);
    }
  }

  console.log("\n" + "═".repeat(70));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
