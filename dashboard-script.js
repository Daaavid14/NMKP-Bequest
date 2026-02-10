
// =========================
// SUPABASE INITIALIZATION
// ========================

const { createClient } = window.supabase;
const supabaseClient = createClient(
  "http://127.0.0.1:54321",
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
);

let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let dataCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let refreshInterval = null;

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

  const recommended = [
    { name: "Shadowfang #0321", type: "ghost", types: ["Ghost", "Poison"], price: 450, emoji: "👻" },
    { name: "Ironhide #0099", type: "rock", types: ["Rock", "Ground"], price: 320, emoji: "🪨" },
    { name: "Frostbite #0188", type: "ice", types: ["Ice", "Dragon"], price: 580, emoji: "❄️" },
    { name: "Thunderclaw #0266", type: "electric", types: ["Electric", "Fighting"], price: 275, emoji: "⚡" },
  ];

  carousel.innerHTML = recommended.map(nft => `
    <div class="nft-card">
      <div class="nft-image">${nft.emoji}</div>
      <div class="nft-name">${nft.name}</div>
      <div class="nft-type-badges">
        ${nft.types.map(t => `<span class="type-badge ${t.toLowerCase()}">${t}</span>`).join("")}
      </div>
      <div style="font-family:var(--font-display);color:var(--gold-700);margin-bottom:8px;">🪙 ${nft.price} PKC</div>
      <button class="btn-primary btn-sm" style="width:100%;">Buy Now</button>
    </div>
  `).join("");
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

  const searchableItems = [
    { name: "Flamewing #0042", type: "Fire / Flying", section: "collection" },
    { name: "Aquascale #0108", type: "Water / Dragon", section: "marketplace" },
    { name: "Voltpaw #0217", type: "Electric", section: "marketplace" },
    { name: "Leafguard #0055", type: "Grass", section: "marketplace" },
    { name: "PKC Wallet", type: "Section", section: "wallet" },
    { name: "Battle Arena", type: "Section", section: "battles" },
    { name: "Tournaments", type: "Section", section: "tournaments" },
    { name: "Settings", type: "Section", section: "settings" },
  ];

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        results.classList.remove("active");
        return;
      }

      const matches = searchableItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:var(--text-light);">No results found</div>';
      } else {
        results.innerHTML = matches.map(item => `
          <div class="search-result-item" data-section="${item.section}">
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
    if (item && item.dataset.section) {
      navigateToSection(item.dataset.section);
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
  populateRecommendedCarousel();

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

  initRealtimeSubscriptions();
  startAutoRefresh();

  console.log("Dashboard initialized successfully!");
}

window.addEventListener("DOMContentLoaded", initDashboard);

window.addEventListener("beforeunload", () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
