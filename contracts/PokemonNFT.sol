// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PokemonNFT
 * @author NOMEKOP Bequest
 * @notice ERC-721 NFT contract for Pokemon with on-chain stats, leveling, and evolution.
 * @dev Evolution stages: 0 = baseForm, 1 = secondForm, 2 = thirdForm
 *      Level thresholds: baseForm→secondForm at level 16, secondForm→thirdForm at level 32
 *      EXP per level: 100 EXP = 1 level
 *      Stat gains per level: HP +5, ATK +3, DEF +2, SPD +2
 *      Evolution bonus: HP +20, ATK +10, DEF +10, SPD +10
 */
contract PokemonNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // ──────────────────────────── Types ────────────────────────────

    enum EvolutionStage { BaseForm, SecondForm, ThirdForm }

    struct PokemonStats {
        uint16 hp;
        uint16 atk;
        uint16 def;
        uint16 spd;
    }

    struct Pokemon {
        string species;          // e.g. "Bulbasaur"
        uint16 level;
        uint32 experience;
        EvolutionStage stage;
        PokemonStats stats;
    }

    // ──────────────────────────── Storage ──────────────────────────

    /// @notice Next token id (starts at 1)
    uint256 private _nextTokenId;

    /// @notice Token id → Pokemon data
    mapping(uint256 => Pokemon) private _pokemon;

    /// @notice species (lowercase) → stage → IPFS metadata CID
    mapping(string => mapping(EvolutionStage => string)) private _metadataCIDs;

    /// @notice species (lowercase) → evolution chain names [base, second, third]
    mapping(string => string[3]) private _evolutionChain;

    /// @notice Addresses authorised to grant experience (owner + game contracts)
    mapping(address => bool) public gameOperators;

    // ──────────────────────────── Constants ────────────────────────

    uint16 public constant EVOLUTION_LEVEL_1 = 16;   // base → second
    uint16 public constant EVOLUTION_LEVEL_2 = 32;   // second → third
    uint32 public constant EXP_PER_LEVEL     = 100;

    // Per-level stat gains
    uint16 public constant HP_PER_LEVEL  = 5;
    uint16 public constant ATK_PER_LEVEL = 3;
    uint16 public constant DEF_PER_LEVEL = 2;
    uint16 public constant SPD_PER_LEVEL = 2;

    // Flat evolution bonus
    uint16 public constant EVOLUTION_HP_BONUS  = 20;
    uint16 public constant EVOLUTION_ATK_BONUS = 10;
    uint16 public constant EVOLUTION_DEF_BONUS = 10;
    uint16 public constant EVOLUTION_SPD_BONUS = 10;

    // ──────────────────────────── Events ───────────────────────────

    event PokemonMinted(
        uint256 indexed tokenId,
        address indexed to,
        string species,
        uint16 hp,
        uint16 atk,
        uint16 def,
        uint16 spd
    );

    event ExperienceGained(
        uint256 indexed tokenId,
        uint32 expGained,
        uint32 totalExp,
        uint16 newLevel
    );

    event LevelUp(
        uint256 indexed tokenId,
        uint16 oldLevel,
        uint16 newLevel,
        uint16 hp,
        uint16 atk,
        uint16 def,
        uint16 spd
    );

    event Evolved(
        uint256 indexed tokenId,
        string fromSpecies,
        string toSpecies,
        EvolutionStage newStage,
        uint16 hp,
        uint16 atk,
        uint16 def,
        uint16 spd
    );

    event EvolutionChainRegistered(
        string baseSpecies,
        string secondSpecies,
        string thirdSpecies
    );

    event GameOperatorUpdated(address indexed operator, bool status);

    // ──────────────────────────── Errors ───────────────────────────

    error NotTokenOwnerOrOperator();
    error PokemonFullyEvolved();
    error LevelTooLowToEvolve(uint16 currentLevel, uint16 requiredLevel);
    error EvolutionChainNotRegistered(string species);
    error MetadataCIDNotSet(string species, EvolutionStage stage);
    error NotGameOperator();
    error ZeroExperience();

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyGameOperator() {
        if (!gameOperators[msg.sender] && msg.sender != owner()) {
            revert NotGameOperator();
        }
        _;
    }

    modifier onlyTokenOwnerOrOperator(uint256 tokenId) {
        if (
            ownerOf(tokenId) != msg.sender &&
            !gameOperators[msg.sender] &&
            msg.sender != owner()
        ) {
            revert NotTokenOwnerOrOperator();
        }
        _;
    }

    // ──────────────────────────── Constructor ─────────────────────

    constructor(
        address initialOwner
    ) ERC721("NOMEKOP Bequest", "NMKP") Ownable(initialOwner) {
        gameOperators[initialOwner] = true;
    }

    // ──────────────────────────── Admin ────────────────────────────

    /**
     * @notice Set or revoke game-operator privileges for an address.
     */
    function setGameOperator(
        address operator,
        bool status
    ) external onlyOwner {
        gameOperators[operator] = status;
        emit GameOperatorUpdated(operator, status);
    }

    /**
     * @notice Register an evolution chain and its metadata CIDs.
     * @param baseSpecies   Lowercase species key for base form     (e.g. "bulbasaur")
     * @param secondSpecies Lowercase species key for second form   (e.g. "ivysaur")
     * @param thirdSpecies  Lowercase species key for third form    (e.g. "venusaur")
     * @param baseCID       IPFS CID for base-form metadata
     * @param secondCID     IPFS CID for second-form metadata
     * @param thirdCID      IPFS CID for third-form metadata
     */
    function registerEvolutionChain(
        string calldata baseSpecies,
        string calldata secondSpecies,
        string calldata thirdSpecies,
        string calldata baseCID,
        string calldata secondCID,
        string calldata thirdCID
    ) external onlyOwner {
        // Store chain mapping for all three names pointing at the same data
        _evolutionChain[baseSpecies]   = [baseSpecies, secondSpecies, thirdSpecies];
        _evolutionChain[secondSpecies] = [baseSpecies, secondSpecies, thirdSpecies];
        _evolutionChain[thirdSpecies]  = [baseSpecies, secondSpecies, thirdSpecies];

        // Store metadata CIDs (keyed by base species)
        _metadataCIDs[baseSpecies][EvolutionStage.BaseForm]   = baseCID;
        _metadataCIDs[baseSpecies][EvolutionStage.SecondForm] = secondCID;
        _metadataCIDs[baseSpecies][EvolutionStage.ThirdForm]  = thirdCID;

        emit EvolutionChainRegistered(baseSpecies, secondSpecies, thirdSpecies);
    }

    // ──────────────────────────── Minting ──────────────────────────

    /**
     * @notice Mint a new Pokemon NFT at level 1 / base form.
     * @param to        Recipient address
     * @param species   Lowercase species key (must have a registered evolution chain)
     * @param hp        Base HP stat
     * @param atk       Base ATK stat
     * @param def_      Base DEF stat  (def is a reserved keyword)
     * @param spd       Base SPD stat
     */
    function mintPokemon(
        address to,
        string calldata species,
        uint16 hp,
        uint16 atk,
        uint16 def_,
        uint16 spd
    ) external onlyOwner returns (uint256) {
        // Verify evolution chain is registered
        if (bytes(_evolutionChain[species][0]).length == 0) {
            revert EvolutionChainNotRegistered(species);
        }

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        _safeMint(to, tokenId);

        // Initialise on-chain Pokemon data
        _pokemon[tokenId] = Pokemon({
            species: species,
            level: 1,
            experience: 0,
            stage: EvolutionStage.BaseForm,
            stats: PokemonStats({
                hp: hp,
                atk: atk,
                def: def_,
                spd: spd
            })
        });

        // Set initial tokenURI to base form metadata
        string memory cid = _metadataCIDs[species][EvolutionStage.BaseForm];
        if (bytes(cid).length == 0) revert MetadataCIDNotSet(species, EvolutionStage.BaseForm);
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit PokemonMinted(tokenId, to, species, hp, atk, def_, spd);
        return tokenId;
    }

    // ──────────────────────────── Experience & Leveling ────────────

    /**
     * @notice Grant experience to a Pokemon. Automatically levels up.
     * @param tokenId  Token to grant EXP to
     * @param amount   Amount of EXP to grant (must be > 0)
     */
    function grantExperience(
        uint256 tokenId,
        uint32 amount
    ) external onlyGameOperator {
        if (amount == 0) revert ZeroExperience();

        Pokemon storage pkmn = _pokemon[tokenId];
        uint16 oldLevel = pkmn.level;

        pkmn.experience += amount;

        // Calculate new level
        uint16 newLevel = uint16(pkmn.experience / EXP_PER_LEVEL) + 1;

        if (newLevel > oldLevel) {
            uint16 levelsGained = newLevel - oldLevel;
            pkmn.level = newLevel;

            // Apply stat gains
            pkmn.stats.hp  += HP_PER_LEVEL  * levelsGained;
            pkmn.stats.atk += ATK_PER_LEVEL * levelsGained;
            pkmn.stats.def += DEF_PER_LEVEL * levelsGained;
            pkmn.stats.spd += SPD_PER_LEVEL * levelsGained;

            emit LevelUp(
                tokenId,
                oldLevel,
                newLevel,
                pkmn.stats.hp,
                pkmn.stats.atk,
                pkmn.stats.def,
                pkmn.stats.spd
            );
        }

        emit ExperienceGained(tokenId, amount, pkmn.experience, pkmn.level);
    }

    // ──────────────────────────── Evolution ────────────────────────

    /**
     * @notice Evolve a Pokemon to its next evolution stage.
     *         Caller must be token owner, game operator, or contract owner.
     * @param tokenId Token to evolve
     */
    function evolvePokemon(
        uint256 tokenId
    ) external onlyTokenOwnerOrOperator(tokenId) {
        Pokemon storage pkmn = _pokemon[tokenId];

        if (pkmn.stage == EvolutionStage.ThirdForm) {
            revert PokemonFullyEvolved();
        }

        // Determine required level
        uint16 requiredLevel = pkmn.stage == EvolutionStage.BaseForm
            ? EVOLUTION_LEVEL_1
            : EVOLUTION_LEVEL_2;

        if (pkmn.level < requiredLevel) {
            revert LevelTooLowToEvolve(pkmn.level, requiredLevel);
        }

        // Resolve the base species key for CID lookup
        string memory baseSpecies = _evolutionChain[pkmn.species][0];
        if (bytes(baseSpecies).length == 0) {
            revert EvolutionChainNotRegistered(pkmn.species);
        }

        string memory oldSpecies = pkmn.species;

        // Advance stage
        EvolutionStage newStage;
        string memory newSpeciesName;
        if (pkmn.stage == EvolutionStage.BaseForm) {
            newStage = EvolutionStage.SecondForm;
            newSpeciesName = _evolutionChain[pkmn.species][1];
        } else {
            newStage = EvolutionStage.ThirdForm;
            newSpeciesName = _evolutionChain[pkmn.species][2];
        }

        pkmn.stage = newStage;
        pkmn.species = newSpeciesName;

        // Apply evolution stat bonus
        pkmn.stats.hp  += EVOLUTION_HP_BONUS;
        pkmn.stats.atk += EVOLUTION_ATK_BONUS;
        pkmn.stats.def += EVOLUTION_DEF_BONUS;
        pkmn.stats.spd += EVOLUTION_SPD_BONUS;

        // Update tokenURI to new evolution metadata
        string memory cid = _metadataCIDs[baseSpecies][newStage];
        if (bytes(cid).length == 0) revert MetadataCIDNotSet(baseSpecies, newStage);
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit Evolved(
            tokenId,
            oldSpecies,
            newSpeciesName,
            newStage,
            pkmn.stats.hp,
            pkmn.stats.atk,
            pkmn.stats.def,
            pkmn.stats.spd
        );
    }

    // ──────────────────────────── View helpers ─────────────────────

    /**
     * @notice Get full on-chain Pokemon data for a token.
     */
    function getPokemon(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory species,
            uint16 level,
            uint32 experience,
            EvolutionStage stage,
            uint16 hp,
            uint16 atk,
            uint16 def_,
            uint16 spd
        )
    {
        Pokemon storage p = _pokemon[tokenId];
        return (
            p.species,
            p.level,
            p.experience,
            p.stage,
            p.stats.hp,
            p.stats.atk,
            p.stats.def,
            p.stats.spd
        );
    }

    /**
     * @notice Get only the stats for a Pokemon.
     */
    function getStats(
        uint256 tokenId
    ) external view returns (uint16 hp, uint16 atk, uint16 def_, uint16 spd) {
        PokemonStats storage s = _pokemon[tokenId].stats;
        return (s.hp, s.atk, s.def, s.spd);
    }

    /**
     * @notice Get the level and experience of a Pokemon.
     */
    function getLevelAndExp(
        uint256 tokenId
    ) external view returns (uint16 level, uint32 experience, uint32 expToNextLevel) {
        Pokemon storage p = _pokemon[tokenId];
        uint32 expForCurrentLevel = uint32(p.level - 1) * EXP_PER_LEVEL;
        uint32 remaining = (expForCurrentLevel + EXP_PER_LEVEL) - p.experience;
        return (p.level, p.experience, remaining);
    }

    /**
     * @notice Check whether a Pokemon can evolve right now.
     */
    function canEvolve(
        uint256 tokenId
    ) external view returns (bool, uint16 requiredLevel) {
        Pokemon storage p = _pokemon[tokenId];
        if (p.stage == EvolutionStage.ThirdForm) return (false, 0);

        uint16 req = p.stage == EvolutionStage.BaseForm
            ? EVOLUTION_LEVEL_1
            : EVOLUTION_LEVEL_2;

        return (p.level >= req, req);
    }

    /**
     * @notice Retrieve the metadata CIDs for a registered species chain.
     */
    function getEvolutionChainCIDs(
        string calldata baseSpecies
    )
        external
        view
        returns (
            string memory baseCID,
            string memory secondCID,
            string memory thirdCID
        )
    {
        return (
            _metadataCIDs[baseSpecies][EvolutionStage.BaseForm],
            _metadataCIDs[baseSpecies][EvolutionStage.SecondForm],
            _metadataCIDs[baseSpecies][EvolutionStage.ThirdForm]
        );
    }

    // ──────────────────────────── Overrides (required) ─────────────

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
