/**
 * deploy.js — Deploy PokemonNFT to Sepolia and register all evolution chains.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network sepolia --config hardhat.config.cjs
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ── Evolution chain definitions ─────────────────────────────────────────────
// Each entry: [baseSpecies, secondFormSpecies, thirdFormSpecies]
const EVOLUTION_CHAINS = [
  ["bulbasaur", "ivysaur", "venasaur"],
  ["charmander", "charmeleon", "charizard"],
  ["squirtle", "wartortle", "blastoise"],
  ["caterpie", "metapod", "butterfree"],
  ["weedle", "kakuna", "beedrill"],
  ["pidgey", "pidgeotto", "pidgeot"],
  ["pichu", "pikachu", "raichu"],
  ["machop", "machoke", "machamp"],
  ["ghastly", "haunter", "gengar"],
  ["dratini", "dragonair", "dragonite"],
  ["eevee", "flareon", "jolteon"],
  ["elekid", "electabuzz", "electivire"],
  ["magby", "magmar", "magmortar"],
  ["horsea", "seadra", "kingdra"],
  ["larvitar", "pupitar", "tyranitar"],
  ["cyndaquil", "quilava", "typhlosion"],
  ["totodile", "croconaw", "feraligatr"],
  ["torchic", "combusken", "blaziken"],
  ["swinub", "piloswine", "mamoswine"],
  ["whismur", "loudred", "exploud"],
];

/**
 * Map a lowercase species key to its metadata CID in cids.json.
 * The JSON keys are capitalised filenames like "Bulbasaur.json".
 */
function findMetadataCID(cidSection, speciesKey) {
  // Build the expected key: capitalise first letter + ".json"
  const capitalized = speciesKey.charAt(0).toUpperCase() + speciesKey.slice(1);
  const key = `${capitalized}.json`;
  const cid = cidSection[key];
  if (!cid) {
    throw new Error(`Metadata CID not found for "${key}" in cids.json`);
  }
  return cid;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── Deploy ──────────────────────────────────────────────────────────────
  console.log("\n📦 Deploying PokemonNFT...");
  const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
  const pokemon = await PokemonNFT.deploy(deployer.address);
  await pokemon.waitForDeployment();

  const contractAddress = await pokemon.getAddress();
  console.log("✅ PokemonNFT deployed to:", contractAddress);

  // ── Load CIDs ───────────────────────────────────────────────────────────
  const cidsPath = path.join(__dirname, "..", "metadata", "cids.json");
  const cids = JSON.parse(fs.readFileSync(cidsPath, "utf-8"));

  // ── Register evolution chains ──────────────────────────────────────────
  console.log("\n🔗 Registering evolution chains...");
  for (const [base, second, third] of EVOLUTION_CHAINS) {
    const baseCID = findMetadataCID(cids.metadata.baseForm, base);
    const secondCID = findMetadataCID(cids.metadata.secondForm, second);
    const thirdCID = findMetadataCID(cids.metadata.thirdForm, third);

    const tx = await pokemon.registerEvolutionChain(
      base,
      second,
      third,
      baseCID,
      secondCID,
      thirdCID
    );
    await tx.wait();
    console.log(`  ✓ ${base} → ${second} → ${third}`);
  }

  console.log("\n🎉 All evolution chains registered!");

  // ── Save deployment info ───────────────────────────────────────────────
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
  };

  const outPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");
  console.log(deploymentInfo);

  // ── Verify on Etherscan (waits for propagation) ────────────────────────
  if (hre.network.name === "sepolia") {
    console.log("\n⏳ Waiting 30 seconds for Etherscan indexing...");
    await new Promise((r) => setTimeout(r, 30_000));

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (err) {
      console.warn("⚠️  Etherscan verification failed:", err.message);
      console.log(
        "   You can verify manually later with:\n" +
          `   npx hardhat verify --network sepolia --config hardhat.config.cjs ${contractAddress} "${deployer.address}"`
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
