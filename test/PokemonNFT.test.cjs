/**
 * PokemonNFT test suite
 *
 * Run:
 *   npx hardhat test --config hardhat.config.cjs
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokemonNFT", function () {
  let pokemon, owner, player, operator;

  // Test CIDs (fake but valid-length)
  const BASE_CID = "bafkreicrxunbzncdrjf32m4zljb5aff5s23qqxhcqgzbcf3dna4kle224m";
  const SECOND_CID = "bafkreid5jek75tn3cbt6hdmyoowipy7mii32lsyywrjtqpeo7boekee264";
  const THIRD_CID = "bafkreif3j54lwdxo7m3o3mt5vhwtwc2tyu6knmmkc3dgdjmmjk2ftnvudq";

  beforeEach(async function () {
    [owner, player, operator] = await ethers.getSigners();

    const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
    pokemon = await PokemonNFT.deploy(owner.address);
    await pokemon.waitForDeployment();

    // Register one evolution chain
    await pokemon.registerEvolutionChain(
      "bulbasaur",
      "ivysaur",
      "venasaur",
      BASE_CID,
      SECOND_CID,
      THIRD_CID
    );
  });

  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      expect(await pokemon.name()).to.equal("NOMEKOP Bequest");
      expect(await pokemon.symbol()).to.equal("NMKP");
    });

    it("should set the deployer as owner and game operator", async function () {
      expect(await pokemon.owner()).to.equal(owner.address);
      expect(await pokemon.gameOperators(owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("should mint a Pokemon with correct initial stats", async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);

      const [species, level, exp, stage, hp, atk, def_, spd] =
        await pokemon.getPokemon(1);

      expect(species).to.equal("bulbasaur");
      expect(level).to.equal(1);
      expect(exp).to.equal(0);
      expect(stage).to.equal(0); // BaseForm
      expect(hp).to.equal(294);
      expect(atk).to.equal(49);
      expect(def_).to.equal(49);
      expect(spd).to.equal(45);
    });

    it("should set the correct tokenURI", async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
      const uri = await pokemon.tokenURI(1);
      expect(uri).to.equal(`ipfs://${BASE_CID}`);
    });

    it("should emit PokemonMinted event", async function () {
      await expect(
        pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45)
      )
        .to.emit(pokemon, "PokemonMinted")
        .withArgs(1, player.address, "bulbasaur", 294, 49, 49, 45);
    });

    it("should revert for non-owner minting", async function () {
      await expect(
        pokemon
          .connect(player)
          .mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45)
      ).to.be.revertedWithCustomError(pokemon, "OwnableUnauthorizedAccount");
    });

    it("should revert for unregistered species", async function () {
      await expect(
        pokemon.mintPokemon(player.address, "mewtwo", 294, 49, 49, 45)
      ).to.be.revertedWithCustomError(pokemon, "EvolutionChainNotRegistered");
    });

    it("should increment token IDs", async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
      expect(await pokemon.totalSupply()).to.equal(2);
      expect(await pokemon.ownerOf(2)).to.equal(player.address);
    });
  });

  describe("Experience & Leveling", function () {
    beforeEach(async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
    });

    it("should grant experience and level up", async function () {
      // 500 EXP = level 6 (floor(500/100) + 1 = 6)
      await pokemon.grantExperience(1, 500);

      const [, level, exp] = await pokemon.getPokemon(1);
      expect(level).to.equal(6);
      expect(exp).to.equal(500);
    });

    it("should increase stats on level up", async function () {
      // Level 1 → 6 = 5 levels gained
      await pokemon.grantExperience(1, 500);

      const [hp, atk, def_, spd] = await pokemon.getStats(1);
      expect(hp).to.equal(294 + 5 * 5);   // +25
      expect(atk).to.equal(49 + 5 * 3);   // +15
      expect(def_).to.equal(49 + 5 * 2);  // +10
      expect(spd).to.equal(45 + 5 * 2);   // +10
    });

    it("should emit LevelUp and ExperienceGained events", async function () {
      await expect(pokemon.grantExperience(1, 500))
        .to.emit(pokemon, "LevelUp")
        .and.to.emit(pokemon, "ExperienceGained");
    });

    it("should revert for zero experience", async function () {
      await expect(
        pokemon.grantExperience(1, 0)
      ).to.be.revertedWithCustomError(pokemon, "ZeroExperience");
    });

    it("should revert for non-operator", async function () {
      await expect(
        pokemon.connect(player).grantExperience(1, 100)
      ).to.be.revertedWithCustomError(pokemon, "NotGameOperator");
    });

    it("should calculate EXP to next level correctly", async function () {
      await pokemon.grantExperience(1, 250); // Level 3, exp=250
      const [level, totalExp, toNext] = await pokemon.getLevelAndExp(1);
      expect(level).to.equal(3);
      expect(totalExp).to.equal(250);
      expect(toNext).to.equal(50); // needs 300 for level 4, 300-250=50
    });
  });

  describe("Evolution", function () {
    beforeEach(async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
    });

    it("should evolve from base to second form at level 16", async function () {
      // Grant enough EXP for level 16: (16-1)*100 = 1500
      await pokemon.grantExperience(1, 1500);

      const [canEvolveNow] = await pokemon.canEvolve(1);
      expect(canEvolveNow).to.be.true;

      await pokemon.connect(player).evolvePokemon(1);

      const [species, , , stage] = await pokemon.getPokemon(1);
      expect(species).to.equal("ivysaur");
      expect(stage).to.equal(1); // SecondForm
    });

    it("should apply evolution stat bonuses", async function () {
      await pokemon.grantExperience(1, 1500);
      // Before evolution: base + 15 level-ups of stat gains
      // HP: 294 + 15*5 = 369, ATK: 49 + 15*3 = 94, DEF: 49 + 15*2 = 79, SPD: 45 + 15*2 = 75

      await pokemon.connect(player).evolvePokemon(1);

      const [hp, atk, def_, spd] = await pokemon.getStats(1);
      expect(hp).to.equal(369 + 20);   // + evolution bonus
      expect(atk).to.equal(94 + 10);
      expect(def_).to.equal(79 + 10);
      expect(spd).to.equal(75 + 10);
    });

    it("should update tokenURI on evolution", async function () {
      await pokemon.grantExperience(1, 1500);
      await pokemon.connect(player).evolvePokemon(1);

      const uri = await pokemon.tokenURI(1);
      expect(uri).to.equal(`ipfs://${SECOND_CID}`);
    });

    it("should evolve from second to third form at level 32", async function () {
      // First evolution
      await pokemon.grantExperience(1, 1500);
      await pokemon.connect(player).evolvePokemon(1);

      // Second evolution — need level 32: (32-1)*100 = 3100 total
      await pokemon.grantExperience(1, 1600); // already had 1500
      await pokemon.connect(player).evolvePokemon(1);

      const [species, , , stage] = await pokemon.getPokemon(1);
      expect(species).to.equal("venasaur");
      expect(stage).to.equal(2); // ThirdForm

      const uri = await pokemon.tokenURI(1);
      expect(uri).to.equal(`ipfs://${THIRD_CID}`);
    });

    it("should revert when level too low", async function () {
      await expect(
        pokemon.connect(player).evolvePokemon(1)
      ).to.be.revertedWithCustomError(pokemon, "LevelTooLowToEvolve");
    });

    it("should revert when fully evolved", async function () {
      await pokemon.grantExperience(1, 3100);
      await pokemon.connect(player).evolvePokemon(1);
      await pokemon.connect(player).evolvePokemon(1);

      await expect(
        pokemon.connect(player).evolvePokemon(1)
      ).to.be.revertedWithCustomError(pokemon, "PokemonFullyEvolved");
    });

    it("should emit Evolved event", async function () {
      await pokemon.grantExperience(1, 1500);

      await expect(pokemon.connect(player).evolvePokemon(1))
        .to.emit(pokemon, "Evolved")
        .withArgs(
          1,
          "bulbasaur",
          "ivysaur",
          1, // SecondForm
          389, // 294 + 15*5 + 20
          104, // 49 + 15*3 + 10
          89,  // 49 + 15*2 + 10
          85   // 45 + 15*2 + 10
        );
    });
  });

  describe("Game Operators", function () {
    it("should allow owner to add/remove operators", async function () {
      await pokemon.setGameOperator(operator.address, true);
      expect(await pokemon.gameOperators(operator.address)).to.be.true;

      await pokemon.setGameOperator(operator.address, false);
      expect(await pokemon.gameOperators(operator.address)).to.be.false;
    });

    it("should allow operators to grant experience", async function () {
      await pokemon.mintPokemon(player.address, "bulbasaur", 294, 49, 49, 45);
      await pokemon.setGameOperator(operator.address, true);

      await pokemon.connect(operator).grantExperience(1, 200);
      const [, level] = await pokemon.getPokemon(1);
      expect(level).to.equal(3);
    });
  });

  describe("View Functions", function () {
    it("should return correct evolution chain CIDs", async function () {
      const [baseCID, secondCID, thirdCID] =
        await pokemon.getEvolutionChainCIDs("bulbasaur");
      expect(baseCID).to.equal(BASE_CID);
      expect(secondCID).to.equal(SECOND_CID);
      expect(thirdCID).to.equal(THIRD_CID);
    });
  });
});
