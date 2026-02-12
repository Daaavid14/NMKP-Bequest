
// =========================
// SUPABASE INITIALIZATION
// ========================

const { createClient } = window.supabase;
const supabaseClient = createClient(
  "https://mtwaqclwqmmprxhafpbk.supabase.co",
  "sb_publishable_1Aayly4Jq3_kIPDnrRN79w_m4NFfE4F"
);

let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let dataCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let refreshInterval = null;

// ==============================
// BLOCKCHAIN / NFT CONFIGURATION
// ==============================

const NFT_CONFIG = {
  contractAddress: "0xBc26F38c9be4fcE60623d50cB21dB7BEe2B46e46",
  chainId: "0xaa36a7", // Sepolia = 11155111 decimal
  chainIdDecimal: 11155111,
  chainName: "Sepolia Testnet",
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  ipfsGateway: "https://red-capable-stork-490.mypinata.cloud/ipfs/",
};

// Minimal ABI for read-only functions we need
const POKEMON_NFT_ABI = [
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getPokemon(uint256 tokenId) view returns (string species, uint16 level, uint32 experience, uint8 stage, uint16 hp, uint16 atk, uint16 def_, uint16 spd)",
  "function getStats(uint256 tokenId) view returns (uint16 hp, uint16 atk, uint16 def_, uint16 spd)",
  "function getLevelAndExp(uint256 tokenId) view returns (uint16 level, uint32 experience, uint32 expToNextLevel)",
  "function canEvolve(uint256 tokenId) view returns (bool, uint16 requiredLevel)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

// Nomekop species catalog with their types and image CIDs (from cids.json)
const NOMEKOP_CATALOG = {
  baseForm: [
    { species: "Bulbasaur", type: "Grass", type2: "Poison", cid: "bafybeig2gkklyrecvjhfqdruwzn6467ltvpxozoxlo4f5dkk6ca4oj5gtu" },
    { species: "Charmander", type: "Fire", cid: "bafybeih7vj4zexoudevybklic5yfuju774rawtwul2oh4ol7wmdobl6o3y" },
    { species: "Squirtle", type: "Water", cid: "bafybeigsyqyulyboon57jqide45w7vhnoxdpuuafrrqaulq34cntnrpeee" },
    { species: "Pichu", type: "Electric", cid: "bafybeih2fi2cjibpzmdo5uz52vxdph3f7dyqaqyyl7xzwb2xgwa2s4byai" },
    { species: "Caterpie", type: "Bug", cid: "bafybeiczhe3ppwiq3uin76q6bi5cx6lkuly7joe3f33twervphqiy7qcyu" },
    { species: "Weedle", type: "Bug", type2: "Poison", cid: "bafybeicmza6kpqoxjtoyfl6atovzgwsiluxryneh2qi7o2b7qg3telruzq" },
    { species: "Pidgey", type: "Normal", type2: "Flying", cid: "bafybeihmskdzra7knccvkupvtlf5zg3g2xi3qv5ujfe5nlk6apfwzmk444" },
    { species: "Machop", type: "Fighting", cid: "bafybeif5k6cq7b4zcfdfznktsxiotpgwbgctxszhh5v3wrnuyjarbybpcy" },
    { species: "Ghastly", type: "Ghost", type2: "Poison", cid: "bafybeif6uibrgja2amjgqou2xiabyxdcv3plmxj5w57xw7qddotqmi25qq" },
    { species: "Dratini", type: "Dragon", cid: "bafybeicrg44rjui5h32hyl6j2geswr522zluan6sbaias626rzxj54px3i" },
    { species: "Eevee", type: "Normal", cid: "bafybeicslhfoyyv3xbdbx6otplueetyfh3tsn35qfdvpht6cssgwvgt2le" },
    { species: "Cyndaquil", type: "Fire", cid: "bafybeigitzbhafjjjtefpqdqcwysvntkuifg6aswyy35o47gwtzc7skrj4" },
    { species: "Totodile", type: "Water", cid: "bafybeiculnrrjt7gcqntsq6if5dr2ttvfom3ugtk4tqenhdlhkk3g4iof4" },
    { species: "Torchic", type: "Fire", cid: "bafybeidfkze5kg2obx5kvkzrsitpvlw5qznjyvr2o6npbkpgbmv7hpxsnm" },
    { species: "Horsea", type: "Water", cid: "bafybeibjcv2sf3q6xem6ntqtsxspzayflb5vqsidky6njzv6a4rpmdcdaq" },
    { species: "Elekid", type: "Electric", cid: "bafybeic4dc6jmmuse46zuaiaz5dmbylghmg72n3lmzrxnowluacqjrbttu" },
    { species: "Magby", type: "Fire", cid: "bafybeice2ojqxup763fslufn4xlrxvwzc5yqlrhl5vxvvxpkrqcfbbuhkq" },
    { species: "Larvitar", type: "Rock", type2: "Ground", cid: "bafybeibxmi3gnxgpzqthyzvsp4cve6tmwrltv7zrrjds24qtsnvdncow34" },
    { species: "Swinub", type: "Ice", type2: "Ground", cid: "bafybeig75oblkmmuui6cny6pnzwk6vmxdrcayf2uwmyuttrtkcihggzo7a" },
    { species: "Whismur", type: "Normal", cid: "bafybeictio2lysja3p6xpy4h4gzvvhrsocmelcewpjcv2oe36cophmstuq" },
  ],
  secondForm: [
    { species: "Ivysaur", type: "Grass", type2: "Poison", cid: "bafybeigzxfic72o2w3v3btdsar2aowkj47rlgfhtrpxt4pkff2wp3bt2km" },
    { species: "Charmeleon", type: "Fire", cid: "bafybeifgqszmgwuphxyfophfo7ayjtvzxp4qfcs6c4t3h2tvdcezc7id5u" },
    { species: "Wartortle", type: "Water", cid: "bafybeiflrdkyu32ersjqjczdxmgqu7wxg4z3qvrqqswdhmowfd4yo3s2me" },
    { species: "Pikachu", type: "Electric", cid: "bafybeihadwonyu4hqhl3zfykhzcqmbc26ktwxdwubpbie7nkmtjac4zn2a" },
    { species: "Metapod", type: "Bug", cid: "bafybeihc7ht5lf2bk555yhpat7ozxcm3dc26kb7zdstkcotxak5qd43g44" },
    { species: "Kakuna", type: "Bug", type2: "Poison", cid: "bafybeibnpajf5ljoyyq23daulcq5rhdsej7yxass2nj4igaamuregwhlya" },
    { species: "Pidgeotto", type: "Normal", type2: "Flying", cid: "bafybeicvysmvbqse2h3h4dkyt2xbz4n56rjtkd5dtwtofjyqsarub54va4" },
    { species: "Machoke", type: "Fighting", cid: "bafybeigxmgdemzl3tagijgmjjrjt4gdhtpleigrzrn565je5pyzathmwda" },
    { species: "Haunter", type: "Ghost", type2: "Poison", cid: "bafybeiaccub4cklhegfij3fstx3v4aqcsjbczb5dlewddt7mtddq33v57q" },
    { species: "Dragonair", type: "Dragon", cid: "bafybeigdtqetidq5hbzrbbdijwe3zxdd32p57vfhrjo3lz5dvpj24xxgea" },
    { species: "Flareon", type: "Fire", cid: "bafybeiae6vumqvfiyn7siukxgeybntu3xh5zc5xyqbwsvyotigu5xmxlwm" },
    { species: "Quilava", type: "Fire", cid: "bafybeic2y3wvvhqztgfppcsob4vgkiukxnnnffb4boj45k3deukujlkiuu" },
    { species: "Croconaw", type: "Water", cid: "bafybeiapngq6kt2zp7bkrv5ebhvhma675fwfiqytxvf4ononcr4j5dcxli" },
    { species: "Combusken", type: "Fire", type2: "Fighting", cid: "bafybeifi7eczutus6c3sxrm2ms7fvbzsp74x4sudensjiina25kuu6tktq" },
    { species: "Seadra", type: "Water", cid: "bafybeidr2bxoef4xzitbaa7nomgg3rphqguen7v3q2yj3xcsqv5oq3srom" },
    { species: "Electabuzz", type: "Electric", cid: "bafybeidqbqxlfsdblvptitkciql3hy3rqlodbp7mzmaw62jecjqtjfjeva" },
    { species: "Magmar", type: "Fire", cid: "bafybeien7gcbuvlt7dgpk4xwhoqclnp4l44tbd4753jdyrfqq4gajnaqki" },
    { species: "Pupitar", type: "Rock", type2: "Ground", cid: "bafybeigjpe74fdatxgkowmel7ullptr6pnch2xybkdk3lrt37fxelhtp2y" },
    { species: "Piloswine", type: "Ice", type2: "Ground", cid: "bafybeiafqmxjzx2xkaybqevtspm3w3e4ngllf7p5oldlzuzv26s4cpngza" },
    { species: "Loudred", type: "Normal", cid: "bafybeig2ykj5wcd4sc33bjbzfrdua7cfxyj5f36ss3ssgpldd6vuay5idu" },
  ],
  thirdForm: [
    { species: "Venasaur", type: "Grass", type2: "Poison", cid: "bafybeibsjmmh5ztghhgnqp6zfvhfsggv3cba3ztebv7c523yeglnaazl5m" },
    { species: "Charizard", type: "Fire", type2: "Flying", cid: "bafybeidevtdo36iv3jqjm5ami65cneqtoxjkqbspc2afptfnltysexmaxm" },
    { species: "Blastoise", type: "Water", cid: "bafybeid2rt5pquco4i6hun5kmjcz2d23azslnrh3xpjxy5v7ncffsc6gea" },
    { species: "Raichu", type: "Electric", cid: "bafybeigdrqbeehx2clyjswz3b7xxa2lnaiy2x62hjpi7tdconn6zqfvjdq" },
    { species: "Butterfree", type: "Bug", type2: "Flying", cid: "bafybeicmg77ik4ac2gbfrtymtx67wvgriujawalu7pxjex6cpwdqumgpke" },
    { species: "Beedrill", type: "Bug", type2: "Poison", cid: "bafybeibrxl2pymzc3l3z62btxhgyplockrl74zxb6ojixoncb5mhfdb7wq" },
    { species: "Pidgeot", type: "Normal", type2: "Flying", cid: "bafybeifobbndwlqyebcxns7he6hdeupbozyfcyhqum6z5bwatnotbij6s4" },
    { species: "Machamp", type: "Fighting", cid: "bafybeihnfbm3jgv3aufjxnmscw6l34hcvnstdv55kzm47dk5dr4ngunegm" },
    { species: "Gengar", type: "Ghost", type2: "Poison", cid: "bafybeiaprc3ebm6nevdxgo74lxojzkqrjjj7ut5cqf7doc2pwiwys6oi3i" },
    { species: "Dragonite", type: "Dragon", type2: "Flying", cid: "bafybeiadr2zconcgsektwclcinjipwphcw3ilh226zqjilp6hebj4q5isu" },
    { species: "Jolteon", type: "Electric", cid: "bafybeibyyjgbs24jbgbcyl3u6ashipeqc7tihyky5x2ldnbqcfohldg2qu" },
    { species: "Typhlosion", type: "Fire", cid: "bafybeifofupwuf53cb2tvbkgny45jm4hkgymd4po22lwum5o7ryq44zxfm" },
    { species: "Feraligatr", type: "Water", cid: "bafybeidwlme2hdiei5baj7cvckoh4vhtftfh3fo6p6preodp2dcwurn2hy" },
    { species: "Blaziken", type: "Fire", type2: "Fighting", cid: "bafybeichc462vgoxinyqsrw2elsf6dvzj7z35tuhc74husvt57swfzzuze" },
    { species: "Kingdra", type: "Water", type2: "Dragon", cid: "bafybeiglpei2w4vpvt6efedfforu2yyjwka7admrxvrt6dkxiy67a5mqly" },
    { species: "Electivire", type: "Electric", cid: "bafybeic3qxbe6xlx2ksymgajom5tvbbymibpvl5vjna6dox2xzxzyo5zqq" },
    { species: "Magmortar", type: "Fire", cid: "bafybeicbmqwlc7zqy4r5ahmwwybfhjxfmotys4mqsnjyfeuiej62eaaqpe" },
    { species: "Tyranitar", type: "Rock", type2: "Dark", cid: "bafybeiglhj4tsqjv7kbowk43ypxpdzh6trv2jhmaxows6ppnevzbljyuz4" },
    { species: "Mamoswine", type: "Ice", type2: "Ground", cid: "bafybeiha3j7uye7k44oyq3yj2ezv7blcvvkxke2kaisafgt6zt4zlgcpxm" },
    { species: "Exploud", type: "Normal", cid: "bafybeigm3alck7b2rojglynw4ttp6ugiajer6qol64kgej5mjoyj663ixa" },
  ],
};

const STAGE_NAMES = ["Base Form", "Second Form", "Third Form"];
const TYPE_EMOJIS = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡", bug: "🐛",
  poison: "☠️", normal: "⚪", flying: "🕊️", fighting: "👊", ghost: "👻",
  dragon: "🐉", ice: "❄️", rock: "🪨", ground: "🏔️", psychic: "🔮", dark: "🌑",
};

// Blockchain state
let web3Provider = null;
let web3Signer = null;
let nftContract = null;
let nftContractReadOnly = null;
let connectedWalletAddress = null;
let allMintedNFTs = [];
let myNFTs = [];

// ===================================
// THEME MANAGEMENT (Dark/Light Mode)
// ===================================

function getStoredTheme() {
  return localStorage.getItem("nmkp-theme") || "system";
}

function getEffectiveTheme(preference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

function applyTheme(theme) {
  const effective = getEffectiveTheme(theme);
  
  document.documentElement.classList.add("theme-transition");
  document.documentElement.setAttribute("data-theme", effective);
  
  setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 350);

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.value = theme;
  }

  localStorage.setItem("nmkp-theme", theme);
  console.log(`Theme set: ${theme} (effective: ${effective})`);
}

function initThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeSelect = document.getElementById("themeSelect");
  const storedTheme = getStoredTheme();

  applyTheme(storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  if (themeSelect) {
    themeSelect.value = storedTheme;
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") {
      applyTheme("system");
    }
  });
}

(function() {
  const stored = localStorage.getItem("nmkp-theme") || "system";
  const effective = stored === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : stored;
  document.documentElement.setAttribute("data-theme", effective);
})();

// =====================
// AUTHENTICATION CHECK
// =====================

async function checkAuth() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "index.html";
      return false;
    }

    currentUser = session.user;
    console.log("Dashboard: User authenticated:", currentUser.email);
    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "index.html";
    return false;
  }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    window.location.href = "index.html";
  }
});

// =============
// DATA LOADING
// =============

async function loadUserProfile() {
  try {
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) throw error;
    currentProfile = data;
    return data;
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
}

async function loadUserSettings() {
  try {
    const { data, error } = await supabaseClient
      .from("user_settings")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    currentSettings = data;
    return data;
  } catch (error) {
    console.error("Error loading settings:", error);
    return null;
  }
}

async function loadActivityLogs() {
  try {
    const { data, error } = await supabaseClient
      .from("activity_logs")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error loading activity logs:", error);
    return [];
  }
}

async function loadWalletConnections() {
  try {
    const { data, error } = await supabaseClient
      .from("wallet_connections")
      .select("*")
      .eq("user_id", currentUser.id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error loading wallets:", error);
    return [];
  }
}

async function loadAllDashboardData() {
  const [profile, settings, activities, wallets] = await Promise.all([
    loadUserProfile(),
    loadUserSettings(),
    loadActivityLogs(),
    loadWalletConnections(),
  ]);

  return { profile, settings, activities, wallets };
}

// ====================
// BLOCKCHAIN FUNCTIONS
// ====================

function getReadOnlyProvider() {
  return new ethers.providers.JsonRpcProvider(NFT_CONFIG.rpcUrl);
}

function getReadOnlyContract() {
  if (!nftContractReadOnly) {
    const provider = getReadOnlyProvider();
    nftContractReadOnly = new ethers.Contract(NFT_CONFIG.contractAddress, POKEMON_NFT_ABI, provider);
  }
  return nftContractReadOnly;
}

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("🦊 MetaMask is not installed! Please install MetaMask to connect your wallet.");
    return false;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) return false;

    // Check and switch to Sepolia
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId !== NFT_CONFIG.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: NFT_CONFIG.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: NFT_CONFIG.chainId,
              chainName: "Sepolia Testnet",
              rpcUrls: [NFT_CONFIG.rpcUrl],
              blockExplorerUrls: [NFT_CONFIG.explorerUrl],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    web3Signer = web3Provider.getSigner();
    connectedWalletAddress = accounts[0];
    nftContract = new ethers.Contract(NFT_CONFIG.contractAddress, POKEMON_NFT_ABI, web3Signer);

    updateWalletUI_Blockchain();
    console.log("Wallet connected:", connectedWalletAddress);
    return true;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Failed to connect wallet: " + error.message);
    return false;
  }
}

function updateWalletUI_Blockchain() {
  const pill = document.getElementById("walletConnectPill");
  const statusText = document.getElementById("navWalletStatus");
  const collectionDot = document.getElementById("collectionChainDot");
  const collectionText = document.getElementById("collectionChainText");

  if (connectedWalletAddress && pill && statusText) {
    const short = `${connectedWalletAddress.slice(0, 6)}...${connectedWalletAddress.slice(-4)}`;
    statusText.textContent = short;
    pill.classList.add("connected");
    pill.title = connectedWalletAddress;
  }

  if (collectionDot && collectionText) {
    if (connectedWalletAddress) {
      collectionDot.classList.add("connected");
      collectionText.textContent = `Connected: ${connectedWalletAddress.slice(0, 6)}...${connectedWalletAddress.slice(-4)} on Sepolia`;
    } else {
      collectionDot.classList.remove("connected");
      collectionText.textContent = "Connect wallet to view your on-chain Nomekops";
    }
  }
}

function resolveIpfsUrl(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return NFT_CONFIG.ipfsGateway + uri.replace("ipfs://", "");
  }
  return uri;
}

function findSpeciesImageCid(speciesName) {
  const nameLower = speciesName.toLowerCase();
  for (const stage of ["baseForm", "secondForm", "thirdForm"]) {
    const found = NOMEKOP_CATALOG[stage].find(s => s.species.toLowerCase() === nameLower);
    if (found) return found.cid;
  }
  return null;
}

function findSpeciesInfo(speciesName) {
  const nameLower = speciesName.toLowerCase();
  for (const stage of ["baseForm", "secondForm", "thirdForm"]) {
    const found = NOMEKOP_CATALOG[stage].find(s => s.species.toLowerCase() === nameLower);
    if (found) return { ...found, stageName: stage === "baseForm" ? "Base Form" : stage === "secondForm" ? "Second Form" : "Third Form" };
  }
  return null;
}

async function loadAllMintedNFTs() {
  try {
    const contract = getReadOnlyContract();
    const totalSupply = await contract.totalSupply();
    const total = totalSupply.toNumber();

    setTextContent("totalSupplyBadge", `Total Minted: ${total}`);

    if (total === 0) {
      allMintedNFTs = [];
      renderMarketplaceGrid([]);
      return;
    }

    const promises = [];
    for (let i = 0; i < total; i++) {
      promises.push(loadSingleNFT(contract, i));
    }

    const results = await Promise.allSettled(promises);
    allMintedNFTs = results
      .filter(r => r.status === "fulfilled" && r.value)
      .map(r => r.value);

    console.log(`Loaded ${allMintedNFTs.length} NFTs from blockchain`);
    renderMarketplaceGrid(allMintedNFTs);
    updateOverviewNFTCount();

  } catch (error) {
    console.error("Error loading NFTs:", error);
    const grid = document.getElementById("marketplaceGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <span class="empty-icon">⚠️</span>
          <div class="empty-title">Unable to load NFTs</div>
          <p class="empty-text">Could not connect to Sepolia network. Check your connection and try again.</p>
          <button class="btn-primary" id="retryLoadNfts">🔄 Retry</button>
        </div>`;
      document.getElementById("retryLoadNfts")?.addEventListener("click", loadAllMintedNFTs);
    }
  }
}

async function loadSingleNFT(contract, index) {
  try {
    const tokenId = await contract.tokenByIndex(index);
    const [pokemonData, owner, tokenURI] = await Promise.all([
      contract.getPokemon(tokenId),
      contract.ownerOf(tokenId),
      contract.tokenURI(tokenId),
    ]);

    const speciesName = pokemonData.species.charAt(0).toUpperCase() + pokemonData.species.slice(1);
    const speciesInfo = findSpeciesInfo(speciesName) || findSpeciesInfo(pokemonData.species);
    const imageCid = speciesInfo?.cid || findSpeciesImageCid(speciesName) || findSpeciesImageCid(pokemonData.species);

    return {
      tokenId: tokenId.toNumber(),
      species: speciesName,
      level: pokemonData.level,
      experience: pokemonData.experience,
      stage: pokemonData.stage,
      stageName: STAGE_NAMES[pokemonData.stage] || "Unknown",
      hp: pokemonData.hp,
      atk: pokemonData.atk,
      def: pokemonData.def_,
      spd: pokemonData.spd,
      owner: owner,
      tokenURI: tokenURI,
      type: speciesInfo?.type || "Normal",
      type2: speciesInfo?.type2 || null,
      imageCid: imageCid,
      imageUrl: imageCid ? `${NFT_CONFIG.ipfsGateway}${imageCid}` : null,
    };
  } catch (err) {
    console.warn(`Failed to load NFT at index ${index}:`, err);
    return null;
  }
}

async function loadMyNFTs() {
  if (!connectedWalletAddress) return;

  try {
    const contract = getReadOnlyContract();
    const balance = await contract.balanceOf(connectedWalletAddress);
    const count = balance.toNumber();

    if (count === 0) {
      myNFTs = [];
      renderMyNFTsGrid([]);
      return;
    }

    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        (async () => {
          const tokenId = await contract.tokenOfOwnerByIndex(connectedWalletAddress, i);
          const found = allMintedNFTs.find(n => n.tokenId === tokenId.toNumber());
          if (found) return found;
          return loadSingleNFT(contract, -1).catch(() => null); // fallback
        })()
      );
    }

    const results = await Promise.allSettled(promises);
    myNFTs = results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
    renderMyNFTsGrid(myNFTs);
    updateOverviewNFTCount();

  } catch (error) {
    console.error("Error loading my NFTs:", error);
  }
}

function updateOverviewNFTCount() {
  const count = connectedWalletAddress ? myNFTs.length : allMintedNFTs.length;
  animateCounter("statNomekops", count);
}

// ====================
// NFT RENDERING
// ====================

function createNFTCardHTML(nft, showOwner = false) {
  const imgSrc = nft.imageUrl || `assets/baseForm/${nft.species}.gif`;
  const type1Class = nft.type.toLowerCase();
  const type2Class = nft.type2 ? nft.type2.toLowerCase() : null;
  const shortOwner = nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : "";
  const stageClass = nft.stage === 0 ? "base" : nft.stage === 1 ? "second" : "third";

  return `
    <div class="nft-card blockchain-nft-card" data-token-id="${nft.tokenId}" data-species="${nft.species.toLowerCase()}" data-type="${nft.type.toLowerCase()}" data-stage="${stageClass}">
      <div class="nft-image nft-image-real">
        <img src="${imgSrc}" alt="${nft.species}" loading="lazy" onerror="this.src='assets/baseForm/${nft.species}.gif'" />
        <div class="nft-stage-badge stage-${stageClass}">${nft.stageName}</div>
        <div class="nft-token-id">#${nft.tokenId}</div>
      </div>
      <div class="nft-name">${nft.species}</div>
      <div class="nft-type-badges">
        <span class="type-badge ${type1Class}"><img src="assets/types/${type1Class}.png" class="type-icon" alt="" /> ${nft.type}</span>
        ${type2Class ? `<span class="type-badge ${type2Class}"><img src="assets/types/${type2Class}.png" class="type-icon" alt="" /> ${nft.type2}</span>` : ""}
      </div>
      <div class="nft-stats-row">
        <div class="nft-mini-stat"><div class="mini-label">HP</div><div class="mini-value">${nft.hp}</div></div>
        <div class="nft-mini-stat"><div class="mini-label">ATK</div><div class="mini-value">${nft.atk}</div></div>
        <div class="nft-mini-stat"><div class="mini-label">DEF</div><div class="mini-value">${nft.def}</div></div>
        <div class="nft-mini-stat"><div class="mini-label">SPD</div><div class="mini-value">${nft.spd}</div></div>
      </div>
      <div class="nft-level-row">
        <span class="nft-level-badge">Lv. ${nft.level}</span>
        <span class="nft-exp-text">${nft.experience} XP</span>
      </div>
      ${showOwner ? `<div class="nft-owner-row" title="${nft.owner}">👤 ${shortOwner}</div>` : ""}
      <button class="btn-primary btn-sm nft-view-btn" style="width:100%;" data-token-id="${nft.tokenId}">View Details</button>
    </div>`;
}

function createCatalogCardHTML(species, stageName) {
  const imgUrl = `${NFT_CONFIG.ipfsGateway}${species.cid}`;
  const type1Class = species.type.toLowerCase();
  const type2Class = species.type2 ? species.type2.toLowerCase() : null;
  const stageClass = stageName === "baseForm" ? "base" : stageName === "secondForm" ? "second" : "third";
  const stageLabel = stageName === "baseForm" ? "Base Form" : stageName === "secondForm" ? "Second Form" : "Third Form";

  return `
    <div class="nft-card catalog-nft-card" data-species="${species.species.toLowerCase()}" data-type="${type1Class}" data-stage="${stageClass}">
      <div class="nft-image nft-image-real">
        <img src="${imgUrl}" alt="${species.species}" loading="lazy" onerror="this.src='assets/${stageName}/${species.species}.gif'" />
        <div class="nft-stage-badge stage-${stageClass}">${stageLabel}</div>
      </div>
      <div class="nft-name">${species.species}</div>
      <div class="nft-type-badges">
        <span class="type-badge ${type1Class}"><img src="assets/types/${type1Class}.png" class="type-icon" alt="" /> ${species.type}</span>
        ${type2Class ? `<span class="type-badge ${type2Class}"><img src="assets/types/${type2Class}.png" class="type-icon" alt="" /> ${species.type2}</span>` : ""}
      </div>
      <div class="catalog-stage-label">${stageLabel}</div>
    </div>`;
}

function renderMarketplaceGrid(nfts) {
  const grid = document.getElementById("marketplaceGrid");
  if (!grid) return;

  if (!nfts || nfts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <span class="empty-icon">🏪</span>
        <div class="empty-title">No NFTs minted yet</div>
        <p class="empty-text">Run <code>npm run mint:sepolia</code> to mint Nomekop NFTs to the blockchain.</p>
      </div>`;
    return;
  }

  grid.innerHTML = nfts.map(nft => createNFTCardHTML(nft, true)).join("");
  attachNFTCardListeners(grid);
}

function renderMyNFTsGrid(nfts) {
  const grid = document.getElementById("myNftsGrid");
  if (!grid) return;

  if (!nfts || nfts.length === 0) {
    if (!connectedWalletAddress) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;" id="myNftsEmpty">
          <span class="empty-icon">🦊</span>
          <div class="empty-title">Connect your wallet</div>
          <p class="empty-text">Connect MetaMask to see your owned Nomekop NFTs on Sepolia.</p>
          <button class="btn-primary" id="connectForMyNfts">🦊 Connect Wallet</button>
        </div>`;
      document.getElementById("connectForMyNfts")?.addEventListener("click", async () => {
        await connectWallet();
        if (connectedWalletAddress) await loadMyNFTs();
      });
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <span class="empty-icon">📦</span>
          <div class="empty-title">No NFTs in this wallet</div>
          <p class="empty-text">You don't own any Nomekop NFTs on this wallet address yet.</p>
        </div>`;
    }
    return;
  }

  grid.innerHTML = nfts.map(nft => createNFTCardHTML(nft, false)).join("");
  attachNFTCardListeners(grid);
}

function renderCollectionGrid(nfts) {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  if (!nfts || nfts.length === 0) {
    const emptyEl = document.getElementById("collectionEmpty");
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  grid.innerHTML = nfts.map(nft => createNFTCardHTML(nft, false)).join("");
  attachNFTCardListeners(grid);
}

function renderCatalogGrid() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  let html = "";
  for (const [stageName, species] of Object.entries(NOMEKOP_CATALOG)) {
    html += species.map(s => createCatalogCardHTML(s, stageName)).join("");
  }
  grid.innerHTML = html;
}

function attachNFTCardListeners(container) {
  container.querySelectorAll(".nft-view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tokenId = parseInt(btn.dataset.tokenId);
      openNFTDetailModal(tokenId);
    });
  });

  container.querySelectorAll(".nft-card[data-token-id]").forEach(card => {
    card.addEventListener("click", () => {
      const tokenId = parseInt(card.dataset.tokenId);
      openNFTDetailModal(tokenId);
    });
  });
}

function openNFTDetailModal(tokenId) {
  const nft = allMintedNFTs.find(n => n.tokenId === tokenId);
  if (!nft) return;

  const modal = document.getElementById("nftDetailModal");
  if (!modal) return;

  const img = document.getElementById("nftDetailImg");
  img.src = nft.imageUrl || `assets/baseForm/${nft.species}.gif`;
  img.alt = nft.species;

  const stageClass = nft.stage === 0 ? "base" : nft.stage === 1 ? "second" : "third";
  const stageBadge = document.getElementById("nftDetailStageBadge");
  stageBadge.textContent = nft.stageName;
  stageBadge.className = `nft-detail-stage-badge stage-${stageClass}`;

  setTextContent("nftDetailName", nft.species);
  setTextContent("nftDetailId", `Token #${nft.tokenId}`);
  setTextContent("nftDetailLevel", nft.level);
  setTextContent("nftDetailExp", `${nft.experience} XP`);
  setTextContent("nftDetailStage", nft.stageName);

  // Find rarity from catalog
  const speciesInfo = findSpeciesInfo(nft.species);
  setTextContent("nftDetailRarity", speciesInfo ? "Common" : "Unknown");

  // Type badges
  const typesEl = document.getElementById("nftDetailTypes");
  if (typesEl) {
    const t1 = nft.type.toLowerCase();
    let html = `<span class="type-badge ${t1}"><img src="assets/types/${t1}.png" class="type-icon" alt="" /> ${nft.type}</span>`;
    if (nft.type2) {
      const t2 = nft.type2.toLowerCase();
      html += `<span class="type-badge ${t2}"><img src="assets/types/${t2}.png" class="type-icon" alt="" /> ${nft.type2}</span>`;
    }
    typesEl.innerHTML = html;
  }

  // Stats with animated bars (max ~500 for hp, ~150 for others)
  const maxHp = 500, maxOther = 150;
  setStatBar("nftStatHp", "nftStatHpVal", nft.hp, maxHp);
  setStatBar("nftStatAtk", "nftStatAtkVal", nft.atk, maxOther);
  setStatBar("nftStatDef", "nftStatDefVal", nft.def, maxOther);
  setStatBar("nftStatSpd", "nftStatSpdVal", nft.spd, maxOther);

  // Owner
  const shortOwner = nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : "--";
  setTextContent("nftDetailOwner", shortOwner);

  // Links
  const etherscanLink = document.getElementById("nftEtherscanLink");
  if (etherscanLink) etherscanLink.href = `${NFT_CONFIG.explorerUrl}/token/${NFT_CONFIG.contractAddress}?a=${nft.tokenId}`;

  const ipfsLink = document.getElementById("nftIpfsLink");
  if (ipfsLink) ipfsLink.href = resolveIpfsUrl(nft.tokenURI);

  modal.classList.add("active");
}

function setStatBar(barId, valId, value, max) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (bar) bar.style.width = `${Math.min((value / max) * 100, 100)}%`;
  if (val) val.textContent = value;
}

// ================================
// MARKETPLACE FILTERS & SEARCH
// ================================

function initMarketplaceFilters() {
  const searchInput = document.getElementById("marketSearch");
  const typeFilter = document.getElementById("marketTypeFilter");
  const stageFilter = document.getElementById("marketStageFilter");
  const sortSelect = document.getElementById("marketSort");
  const refreshBtn = document.getElementById("refreshMarketBtn");

  let filterDebounce = null;

  const applyFilters = () => {
    clearTimeout(filterDebounce);
    filterDebounce = setTimeout(() => {
      const query = (searchInput?.value || "").toLowerCase().trim();
      const typeVal = typeFilter?.value || "";
      const stageVal = stageFilter?.value || "";
      const sortVal = sortSelect?.value || "id-asc";

      let filtered = [...allMintedNFTs];

      if (query) {
        filtered = filtered.filter(n =>
          n.species.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query) ||
          (n.type2 && n.type2.toLowerCase().includes(query)) ||
          `#${n.tokenId}`.includes(query)
        );
      }

      if (typeVal) {
        filtered = filtered.filter(n =>
          n.type.toLowerCase() === typeVal || (n.type2 && n.type2.toLowerCase() === typeVal)
        );
      }

      if (stageVal) {
        const stageMap = { base: 0, second: 1, third: 2 };
        filtered = filtered.filter(n => n.stage === stageMap[stageVal]);
      }

      // Sort
      switch (sortVal) {
        case "id-asc": filtered.sort((a, b) => a.tokenId - b.tokenId); break;
        case "id-desc": filtered.sort((a, b) => b.tokenId - a.tokenId); break;
        case "name": filtered.sort((a, b) => a.species.localeCompare(b.species)); break;
        case "level-high": filtered.sort((a, b) => b.level - a.level); break;
        case "level-low": filtered.sort((a, b) => a.level - b.level); break;
      }

      renderMarketplaceGrid(filtered);
    }, 200);
  };

  searchInput?.addEventListener("input", applyFilters);
  typeFilter?.addEventListener("change", applyFilters);
  stageFilter?.addEventListener("change", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.textContent = "⏳ Loading...";
      refreshBtn.disabled = true;
      await loadAllMintedNFTs();
      if (connectedWalletAddress) await loadMyNFTs();
      refreshBtn.textContent = "🔄 Refresh";
      refreshBtn.disabled = false;
    });
  }
}

function initMarketplaceTabs() {
  const tabBrowse = document.getElementById("tabBrowse");
  const tabMyNfts = document.getElementById("tabMyNfts");
  const tabCatalog = document.getElementById("tabCatalog");

  const browseContent = document.getElementById("browseTabContent");
  const myNftsContent = document.getElementById("myNftsTabContent");
  const catalogContent = document.getElementById("catalogTabContent");
  const filtersEl = document.getElementById("marketplaceFilters");

  function activateTab(tab) {
    [tabBrowse, tabMyNfts, tabCatalog].forEach(t => t?.classList.remove("active"));
    tab?.classList.add("active");

    if (browseContent) browseContent.style.display = tab === tabBrowse ? "" : "none";
    if (myNftsContent) myNftsContent.style.display = tab === tabMyNfts ? "" : "none";
    if (catalogContent) catalogContent.style.display = tab === tabCatalog ? "" : "none";
    if (filtersEl) filtersEl.style.display = tab === tabCatalog ? "none" : "";
  }

  tabBrowse?.addEventListener("click", () => activateTab(tabBrowse));
  tabMyNfts?.addEventListener("click", async () => {
    activateTab(tabMyNfts);
    if (connectedWalletAddress && myNFTs.length === 0) {
      await loadMyNFTs();
    }
  });
  tabCatalog?.addEventListener("click", () => {
    activateTab(tabCatalog);
    const grid = document.getElementById("catalogGrid");
    if (grid && !grid.hasChildNodes()) renderCatalogGrid();
  });
}

// ================================
// WALLET CONNECTION INITIALIZATION
// ================================

function initWalletConnect() {
  const pill = document.getElementById("walletConnectPill");
  const connectForCollection = document.getElementById("connectForCollection");
  const connectForMyNfts = document.getElementById("connectForMyNfts");
  const connectWalletSettings = document.getElementById("connectWalletBtn");
  const refreshCollectionBtn = document.getElementById("refreshCollectionBtn");

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      await loadMyNFTs();
      renderCollectionGrid(myNFTs);
    }
  };

  pill?.addEventListener("click", async () => {
    if (connectedWalletAddress) {
      // Already connected - show address info
      navigator.clipboard?.writeText(connectedWalletAddress);
      pill.title = "Address copied!";
      setTimeout(() => { pill.title = connectedWalletAddress; }, 2000);
    } else {
      await handleConnect();
    }
  });

  connectForCollection?.addEventListener("click", handleConnect);
  connectForMyNfts?.addEventListener("click", handleConnect);
  connectWalletSettings?.addEventListener("click", handleConnect);

  refreshCollectionBtn?.addEventListener("click", async () => {
    if (connectedWalletAddress) {
      await loadMyNFTs();
      renderCollectionGrid(myNFTs);
    } else {
      await handleConnect();
    }
  });

  // Auto-reconnect if previously connected
  if (window.ethereum) {
    window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
      if (accounts && accounts.length > 0) {
        connectedWalletAddress = accounts[0];
        web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        web3Signer = web3Provider.getSigner();
        nftContract = new ethers.Contract(NFT_CONFIG.contractAddress, POKEMON_NFT_ABI, web3Signer);
        updateWalletUI_Blockchain();
        loadMyNFTs().then(() => renderCollectionGrid(myNFTs));
      }
    });

    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        connectedWalletAddress = null;
        myNFTs = [];
        updateWalletUI_Blockchain();
        renderMyNFTsGrid([]);
        renderCollectionGrid([]);
      } else {
        connectedWalletAddress = accounts[0];
        updateWalletUI_Blockchain();
        await loadMyNFTs();
        renderCollectionGrid(myNFTs);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

// ====================
// UI UPDATE FUNCTIONS
// ====================

function updateNavUserInfo() {
  const displayName = currentProfile?.username || currentProfile?.display_name || "Trainer";
  const email = currentUser?.email || "";

  setTextContent("navDisplayName", displayName);
  setTextContent("ddUsername", displayName);
  setTextContent("ddEmail", email);
  setTextContent("welcomeUsername", displayName);
  setTextContent("sidebarLevel", currentProfile?.player_level || 1);
  setTextContent("settingsUsername", currentProfile?.username || "Not set");
  setTextContent("settingsEmail", email);
  setTextContent("settingsBio", currentProfile?.bio || "No bio set");
}

function updateStats() {
  const pkcBalance = currentProfile?.experience_points || 350;
  const nomekopCount = 12;
  const battlesWon = 47;
  const globalRank = 1842;

  animateCounter("statPkc", pkcBalance);
  animateCounter("statNomekops", nomekopCount);
  animateCounter("statBattles", battlesWon);
  setTextContent("statRank", `#${globalRank.toLocaleString()}`);

  setTextContent("navPkcBalance", pkcBalance.toLocaleString());

  setTextContent("walletBalance", `${pkcBalance.toLocaleString()} PKC`);
  const usdValue = (pkcBalance * 0.12).toFixed(2);
  setTextContent("walletUsd", `≈ $${usdValue} USD`);
  setTextContent("walletChange", "+2.35% (24h)");

  const totalBattles = 63;
  const wins = battlesWon;
  const losses = totalBattles - wins;
  const winRate = totalBattles > 0 ? ((wins / totalBattles) * 100).toFixed(1) : 0;

  setTextContent("totalBattlesStat", totalBattles);
  setTextContent("totalWinsStat", wins);
  setTextContent("totalLossesStat", losses);
  setTextContent("winRateStat", `${winRate}%`);

  setTextContent("lbUserRank", globalRank.toLocaleString());
  setTextContent("lbUserName", currentProfile?.username || "You");
  setTextContent("lbUserWins", `${wins} W`);
}

function updateActivityFeed(activities) {
  const list = document.getElementById("activityList");
  if (!list) return;

  if (!activities || activities.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <span class="empty-icon">📭</span>
        <p class="empty-text">No recent activity. Start your adventure!</p>
      </div>`;
    return;
  }

  list.innerHTML = activities.map(act => {
    const iconMap = {
      auth: "🔑",
      gameplay: "🎮",
      purchase: "🛒",
      social: "👥",
      profile: "👤",
      settings: "⚙️",
      security: "🔒",
      system: "🖥️",
    };
    const icon = iconMap[act.activity_category] || "📋";
    const iconClass = act.activity_category === "purchase" ? "purchase" :
                      act.activity_category === "gameplay" ? "battle" :
                      "achievement";
    const time = formatTimeAgo(act.created_at);

    return `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">${icon}</div>
        <div class="activity-details">
          <div class="activity-text">${sanitize(act.description || act.activity_type)}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>`;
  }).join("");
}

function updateSettingsUI() {
  if (!currentSettings) return;

  setChecked("sfxToggle", currentSettings.sfx_volume > 0);
  setChecked("musicToggle", currentSettings.music_volume > 0);
  setSliderValue("masterVolume", Math.round((currentSettings.master_volume || 1) * 100));
  setSelectValue("graphicsQuality", "medium");
  setSelectValue("languageSetting", currentSettings.language || "en");
  setSelectValue("profileVisibility", currentSettings.profile_visibility || "public");
  setChecked("onlineStatusToggle", currentSettings.show_online_status !== false);
  setChecked("friendRequestToggle", true);
}

function updateWalletUI(wallets) {
  if (wallets && wallets.length > 0) {
    const primary = wallets.find(w => w.is_primary) || wallets[0];
    const addr = primary.wallet_address;
    const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    setTextContent("connectedWalletAddr", `${short} (${primary.wallet_type})`);
  }
}

function populateRecommendedCarousel() {
  const carousel = document.getElementById("recommendedCarousel");
  if (!carousel) return;

  // Show real NFTs from blockchain if available, otherwise show from catalog
  if (allMintedNFTs.length > 0) {
    const shuffled = [...allMintedNFTs].sort(() => Math.random() - 0.5).slice(0, 6);
    carousel.innerHTML = shuffled.map(nft => createNFTCardHTML(nft, true)).join("");
    attachNFTCardListeners(carousel);
  } else {
    // Fallback: show catalog entries
    const featured = [
      NOMEKOP_CATALOG.thirdForm[1], // Charizard
      NOMEKOP_CATALOG.thirdForm[9], // Dragonite
      NOMEKOP_CATALOG.thirdForm[8], // Gengar
      NOMEKOP_CATALOG.secondForm[3], // Pikachu
      NOMEKOP_CATALOG.thirdForm[2], // Blastoise
      NOMEKOP_CATALOG.thirdForm[0], // Venasaur
    ];

    carousel.innerHTML = featured.map(species => {
      const imgUrl = `${NFT_CONFIG.ipfsGateway}${species.cid}`;
      const t1Class = species.type.toLowerCase();
      return `
        <div class="nft-card">
          <div class="nft-image nft-image-real">
            <img src="${imgUrl}" alt="${species.species}" loading="lazy" />
          </div>
          <div class="nft-name">${species.species}</div>
          <div class="nft-type-badges">
            <span class="type-badge ${t1Class}"><img src="assets/types/${t1Class}.png" class="type-icon" alt="" /> ${species.type}</span>
            ${species.type2 ? `<span class="type-badge ${species.type2.toLowerCase()}"><img src="assets/types/${species.type2.toLowerCase()}.png" class="type-icon" alt="" /> ${species.type2}</span>` : ""}
          </div>
          <button class="btn-primary btn-sm" style="width:100%;" data-section="marketplace">View in Marketplace</button>
        </div>`;
    }).join("");
  }
}

// ============
// DATE DISPLAY
// ============

function updateWelcomeDate() {
  const el = document.getElementById("welcomeDate");
  if (!el) return;
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  el.textContent = `📅 ${now.toLocaleDateString("en-US", options)}`;
}

// =================
// SPARKLE PARTICLES
// =================

function createSparkleParticles() {
  const container = document.createElement("div");
  container.className = "fire-particles";
  document.body.appendChild(container);

  for (let i = 0; i < 35; i++) {
    const particle = document.createElement("div");
    particle.className = "fire-particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = (2 + Math.random() * 2) + "s";
    const size = 3 + Math.random() * 4;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.bottom = Math.random() * 60 + "vh";
    particle.style.opacity = 0.6 + Math.random() * 0.4;
    container.appendChild(particle);
  }
}

// ============================
// SIDEBAR NAVIGATION & ROUTING
// ============================

function initSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const allSections = document.querySelectorAll(".dashboard-section");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateToSection(section);
    });
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-section]");
    if (btn && !btn.classList.contains("sidebar-link")) {
      e.preventDefault();
      const section = btn.dataset.section;
      navigateToSection(section);
    }
  });

  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById(`section-${hash}`)) {
    navigateToSection(hash);
  }

  window.addEventListener("hashchange", () => {
    const h = window.location.hash.replace("#", "");
    if (h && document.getElementById(`section-${h}`)) {
      switchSection(h);
    }
  });
}

function navigateToSection(sectionId) {
  switchSection(sectionId);
  window.location.hash = sectionId;
  closeSidebar();
  const main = document.getElementById("main-content");
  if (main) main.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchSection(sectionId) {
  document.querySelectorAll(".dashboard-section").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("active"));
  const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add("active");
}

// =============================
// SIDEBAR TOGGLE (Mobile/Tablet)
// =============================

function initSidebarToggle() {
  const toggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("dashboardSidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (toggle) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("dashboardSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
}

// ================
// NOTIFICATION BELL
// ================

function initNotifications() {
  const bell = document.getElementById("notifBell");
  const dropdown = document.getElementById("notifDropdown");
  const markAllBtn = document.getElementById("markAllRead");

  if (bell && dropdown) {
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      const badge = document.getElementById("notifBadge");
      if (badge) badge.style.display = "none";
      document.querySelectorAll(".notification-item.unread").forEach(item => {
        item.classList.remove("unread");
      });
    });
  }

  showSampleNotifications();
}

function showSampleNotifications() {
  const list = document.getElementById("notifList");
  const badge = document.getElementById("notifBadge");
  if (!list) return;

  const sampleNotifs = [
    { icon: "⚔️", text: "You <strong>won</strong> a battle vs @ShadowTrainer!", time: "2 hours ago", unread: true },
    { icon: "🪙", text: "You earned <strong>50 PKC</strong> from daily quests.", time: "5 hours ago", unread: true },
    { icon: "🏆", text: "Genesis Tournament starts in <strong>2 days</strong>!", time: "1 day ago", unread: false },
  ];

  const unreadCount = sampleNotifs.filter(n => n.unread).length;
  if (badge && unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "flex";
  }

  list.innerHTML = sampleNotifs.map(n => `
    <div class="notification-item ${n.unread ? "unread" : ""}">
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-text">
        ${n.text}
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join("");
}

// =================
// USER DROPDOWN MENU
// =================

function initUserMenu() {
  const menu = document.getElementById("userNavMenu");
  const trigger = document.getElementById("userNavTrigger");
  const logoutBtn = document.getElementById("logoutBtn");

  if (trigger && menu) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("active");
      trigger.setAttribute("aria-expanded", menu.classList.contains("active"));
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove("active");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to log out. Please try again.");
      }
    });
  }
}

// ====================
// SEARCH FUNCTIONALITY
// ====================

function initSearch() {
  const input = document.getElementById("globalSearch");
  const results = document.getElementById("searchResults");
  let debounceTimer = null;

  if (!input || !results) return;

  const staticItems = [
    { name: "PKC Wallet", type: "Section", section: "wallet" },
    { name: "Battle Arena", type: "Section", section: "battles" },
    { name: "Tournaments", type: "Section", section: "tournaments" },
    { name: "Settings", type: "Section", section: "settings" },
    { name: "My Collection", type: "Section", section: "collection" },
    { name: "Marketplace", type: "Section", section: "marketplace" },
  ];

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        results.classList.remove("active");
        return;
      }

      // Search sections + minted NFTs + catalog
      const matches = [];

      staticItems.forEach(item => {
        if (item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query)) {
          matches.push(item);
        }
      });

      allMintedNFTs.forEach(nft => {
        if (nft.species.toLowerCase().includes(query) ||
            nft.type.toLowerCase().includes(query) ||
            (nft.type2 && nft.type2.toLowerCase().includes(query)) ||
            `#${nft.tokenId}`.includes(query)) {
          matches.push({
            name: `${nft.species} #${nft.tokenId}`,
            type: `${nft.type} · Lv.${nft.level}`,
            section: "marketplace",
            tokenId: nft.tokenId,
          });
        }
      });

      if (matches.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:var(--text-light);">No results found</div>';
      } else {
        results.innerHTML = matches.slice(0, 8).map(item => `
          <div class="search-result-item" data-section="${item.section}" data-token-id="${item.tokenId || ""}">
            <span>${item.name}</span>
            <span style="font-size:0.75rem;color:var(--text-light);margin-left:auto;">${item.type}</span>
          </div>
        `).join("");
      }
      results.classList.add("active");
    }, 300);
  });

  results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (item) {
      if (item.dataset.tokenId) {
        navigateToSection("marketplace");
        setTimeout(() => openNFTDetailModal(parseInt(item.dataset.tokenId)), 300);
      } else if (item.dataset.section) {
        navigateToSection(item.dataset.section);
      }
      input.value = "";
      results.classList.remove("active");
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove("active");
    }
  });
}

// =============
// FAQ ACCORDION
// =============

function initFaqAccordion() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));

      if (!isOpen) item.classList.add("open");
    });
  });
}

// =============
// TAB SWITCHING
// =============

function initTabs() {
  document.querySelectorAll(".tab-bar").forEach(bar => {
    bar.querySelectorAll(".tab-item").forEach(tab => {
      tab.addEventListener("click", () => {
        bar.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
      });
    });
  });

  document.querySelectorAll(".quest-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".quest-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.qtab;
      document.getElementById("dailyQuestsTab").style.display = target === "daily" ? "block" : "none";
      document.getElementById("weeklyQuestsTab").style.display = target === "weekly" ? "block" : "none";
      document.getElementById("achievementsTab").style.display = target === "achievements" ? "block" : "none";
    });
  });
}

// =======================
// STAKING PERIOD SELECTOR
// =======================

function initStaking() {
  document.querySelectorAll(".stake-period").forEach(period => {
    period.addEventListener("click", () => {
      document.querySelectorAll(".stake-period").forEach(p => p.classList.remove("active"));
      period.classList.add("active");
    });
  });
}

// ================
// MODAL MANAGEMENT
// ================

function initModals() {
  const buyBtn = document.getElementById("buyPkcBtn");
  const buyModal = document.getElementById("buyPkcModal");
  if (buyBtn && buyModal) {
    buyBtn.addEventListener("click", () => buyModal.classList.add("active"));
  }

  const sendBtn = document.getElementById("sendPkcBtn");
  const sendModal = document.getElementById("sendPkcModal");
  if (sendBtn && sendModal) {
    sendBtn.addEventListener("click", () => sendModal.classList.add("active"));
  }

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-overlay").classList.remove("active");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
  });
}

// ============
// SUPPORT FORM
// ============

function initSupportForm() {
  const form = document.getElementById("supportForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = document.getElementById("supportCategory").value;
    const subject = document.getElementById("supportSubject").value.trim();
    const description = document.getElementById("supportDescription").value.trim();

    if (!category || !subject || !description) {
      alert("Please fill in all fields.");
      return;
    }

    alert("✅ Support ticket submitted! We'll get back to you within 24 hours.");
    form.reset();

    const ticketsList = document.getElementById("myTicketsList");
    if (ticketsList) {
      ticketsList.innerHTML = `
        <div class="ticket-item">
          <span style="font-size:1.2rem;">🎫</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:0.88rem;">${sanitize(subject)}</div>
            <div style="font-size:0.78rem;color:var(--text-light);">${sanitize(category)} · Just now</div>
          </div>
          <span class="ticket-status open">Open</span>
        </div>
      ` + ticketsList.innerHTML.replace(/<div class="empty-state"[\s\S]*?<\/div>\s*<\/div>/, "");
    }
  });
}

// ==========================
// FILTER CHIPS (Marketplace)
// ==========================

function initFilterChips() {
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });
}

// ==========
// CSV EXPORT
// ==========

function initExportCsv() {
  const btn = document.getElementById("exportCsvBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const rows = document.querySelectorAll("#txTableBody tr");
    let csv = "Date,Type,Amount,Status,Details\n";
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const values = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`);
      csv += values.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pkc_transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ======================
// REALTIME SUBSCRIPTIONS
// ======================

function initRealtimeSubscriptions() {
  if (!currentUser) return;

  supabaseClient
    .channel("profile-changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "user_profiles",
        filter: `id=eq.${currentUser.id}`,
      },
      (payload) => {
        console.log("Profile updated:", payload.new);
        currentProfile = payload.new;
        updateNavUserInfo();
        updateStats();
      }
    )
    .subscribe();

  supabaseClient
    .channel("activity-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activity_logs",
        filter: `user_id=eq.${currentUser.id}`,
      },
      (payload) => {
        console.log("New activity:", payload.new);
        loadActivityLogs().then(updateActivityFeed);
      }
    )
    .subscribe();
}

function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    if (currentUser) {
      await loadUserProfile();
      updateNavUserInfo();
      updateStats();
    }
  }, 30000);
}

// =================
// UTILITY FUNCTIONS
// =================

function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function setSliderValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setSelectValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 1200;
  const start = 0;
  const startTime = performance.now();

  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);

    el.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toLocaleString();
      el.classList.add("counting");
      setTimeout(() => el.classList.remove("counting"), 500);
    }
  }

  requestAnimationFrame(tick);
}

// ======================
// KEYBOARD ACCESSIBILITY
// ======================

function initKeyboardNav() {
  // Allow Enter/Space to activate sidebar links
  document.querySelectorAll(".sidebar-link").forEach(link => {
    link.setAttribute("tabindex", "0");
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        link.click();
      }
    });
  });
}

// ========================
// SETTINGS CHANGE HANDLERS
// ========================

function initSettingsHandlers() {
  const settingsElements = [
    "sfxToggle", "musicToggle", "onlineStatusToggle",
    "friendRequestToggle", "twoFaToggle", "masterVolume",
    "graphicsQuality", "languageSetting", "profileVisibility",
  ];

  settingsElements.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const eventType = el.type === "checkbox" ? "change" :
                      el.type === "range" ? "input" : "change";

    el.addEventListener(eventType, () => {
      console.log(`Setting changed: ${id} =`, el.type === "checkbox" ? el.checked : el.value);
    });
  });

  const deleteBtn = document.getElementById("deleteAccountBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const confirmed = confirm("⚠️ Are you sure you want to delete your account? This action is permanent and cannot be undone.");
      if (confirmed) {
        const doubleConfirm = confirm("This is your last chance. Type 'DELETE' in the next prompt to confirm.");
        if (doubleConfirm) {
          alert("Account deletion request submitted. Our team will process it within 48 hours.");
        }
      }
    });
  }

  const changePwBtn = document.getElementById("changePasswordBtn");
  if (changePwBtn) {
    changePwBtn.addEventListener("click", async () => {
      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(currentUser.email, {
          redirectTo: window.location.origin + "/index.html",
        });
        if (error) throw error;
        alert("✅ Password reset email sent! Check your inbox.");
      } catch (error) {
        console.error("Password reset error:", error);
        alert("Failed to send password reset email. Please try again.");
      }
    });
  }
}

// ===================
// PAGE INITIALIZATION
// ===================

async function initDashboard() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  createSparkleParticles();

  const { profile, settings, activities, wallets } = await loadAllDashboardData();

  updateNavUserInfo();
  updateWelcomeDate();
  updateStats();
  updateActivityFeed(activities);
  updateSettingsUI();
  updateWalletUI(wallets);

  initSidebarNavigation();
  initSidebarToggle();
  initNotifications();
  initUserMenu();
  initSearch();
  initFaqAccordion();
  initTabs();
  initStaking();
  initModals();
  initSupportForm();
  initFilterChips();
  initExportCsv();
  initKeyboardNav();
  initSettingsHandlers();
  initThemeToggle();

  // Blockchain / NFT Integration
  initWalletConnect();
  initMarketplaceTabs();
  initMarketplaceFilters();

  // Load NFTs from blockchain (async, non-blocking)
  loadAllMintedNFTs().then(() => {
    populateRecommendedCarousel();
  });

  initRealtimeSubscriptions();
  startAutoRefresh();

  console.log("Dashboard initialized with NFT integration!");
}

window.addEventListener("DOMContentLoaded", initDashboard);

window.addEventListener("beforeunload", () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
