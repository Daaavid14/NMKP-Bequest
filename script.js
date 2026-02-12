// ===================================
// SUPABASE INITIALIZATION
// ===================================

const { createClient } = window.supabase;
const supabaseClient = createClient(
  "https://mtwaqclwqmmprxhafpbk.supabase.co",
  "sb_publishable_1Aayly4Jq3_kIPDnrRN79w_m4NFfE4F",
);

let currentUser = null;
let currentProfile = null;

// ===================================
// SPARKLE PARTICLE SYSTEM (COC STYLE)
// ===================================

function createFireParticles() {
  const container = document.createElement("div");
  container.className = "fire-particles";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "fire-particle";

    // Random horizontal position
    particle.style.left = Math.random() * 100 + "%";

    // Staggered animation start
    particle.style.animationDelay = Math.random() * 6 + "s";

    // Varying animation duration for sparkles
    particle.style.animationDuration = 2 + Math.random() * 2 + "s";

    // Smaller particles for sparkle effect
    const size = 4 + Math.random() * 4;
    particle.style.width = size + "px";
    particle.style.height = size + "px";

    // Start from bottom 60% of viewport
    particle.style.bottom = Math.random() * 60 + "vh";

    // Varying opacity
    particle.style.opacity = 0.7 + Math.random() * 0.3;

    // Sparkle float animation
    particle.style.animationName = "sparkleFloat";
    particle.style.animationTimingFunction = "ease-in-out";
    particle.style.animationIterationCount = "infinite";

    container.appendChild(particle);
  }
}

function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    let lastScroll = 0;
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }

      updateActiveNavItem();

      lastScroll = scrollY;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    });
  }
}

// ===================================
// 3. NAVIGATION FUNCTIONALITY
// ===================================

function initMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuClose = document.getElementById("mobileMenuClose");
  const mobileNavLinks = document.querySelectorAll(
    ".mobile-nav-link:not(.mobile-dropdown-trigger)",
  );

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      const isActive = mobileMenu.classList.toggle("active");
      mobileMenuToggle.classList.toggle("active");
      document.body.classList.toggle("mobile-menu-open");
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", closeMobileMenu);
    }

    mobileNavLinks.forEach(link => {
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });

    mobileMenu.addEventListener("click", e => {
      if (e.target === mobileMenu) {
        closeMobileMenu();
      }
    });
  }
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");

  if (mobileMenu && mobileMenuToggle) {
    mobileMenu.classList.remove("active");
    mobileMenuToggle.classList.remove("active");
    document.body.classList.remove("mobile-menu-open");
  }
}

function initMobileDropdowns() {
  const mobileDropdowns = document.querySelectorAll(".mobile-dropdown");

  mobileDropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".mobile-dropdown-trigger");

    if (trigger) {
      trigger.addEventListener("click", e => {
        e.preventDefault();
        dropdown.classList.toggle("active");

        mobileDropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove("active");
          }
        });
      });
    }
  });
}

function initDesktopDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".dropdown-trigger");

    if (trigger) {
      trigger.addEventListener("click", e => {
        if (window.innerWidth > 1023) {
          e.preventDefault();
          dropdown.classList.toggle("active");

          dropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove("active");
            }
          });
        }
      });
    }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown")) {
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove("active");
      });
    }
  });
}

function updateActiveNavItem() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  const scrollY = window.scrollY;

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${sectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });

  if (scrollY < 100) {
    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#hero") {
        link.classList.add("active");
      }
    });
  }
}

function initSmoothScroll() {
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");

      if (href.startsWith("#") && href.length > 1) {
        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();
          const offsetTop = target.offsetTop - 80;

          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });

          closeMobileMenu();
        }
      }
    });
  });
}

function initNavigation() {
  initNavbarScroll();
  initMobileMenu();
  initMobileDropdowns();
  initDesktopDropdowns();
  initSmoothScroll();
  updateActiveNavItem();
}

window.addEventListener("DOMContentLoaded", async () => {
  createFireParticles();
  initNavigation();
  await checkAuthState();
  initAuthListeners();
});

async function checkAuthState() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session) {
      console.log("User logged in:", session.user.email);
      currentUser = session.user;

      await loadUserProfile(session.user.id);

      updateNavigationForLoggedInUser();
    } else {
      console.log("No active session");
      updateNavigationForLoggedOutUser();
    }
  } catch (error) {
    console.error("Error checking auth state:", error);
  }
}

async function loadUserProfile(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    currentProfile = data;
    console.log("Profile loaded:", currentProfile);
    return data;
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
}

function initAuthListeners() {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event);

    if (event === "SIGNED_IN" && session) {
      currentUser = session.user;
      await loadUserProfile(session.user.id);
      updateNavigationForLoggedInUser();
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;
      updateNavigationForLoggedOutUser();
    }
  });
}

// ===================================
// NAVIGATION UPDATE FUNCTIONS
// ===================================

function updateNavigationForLoggedInUser() {
  const navLoginBtn = document.getElementById("navLoginBtn");
  const heroSignupBtn = document.getElementById("heroSignupBtn");
  const heroDashboardBtn = document.getElementById("heroDashboardBtn");
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const mobileSignupBtn = document.getElementById("mobileSignupBtn");
  const mobileDashboardBtn = document.getElementById("mobileDashboardBtn");
  const userMenu = document.getElementById("userMenu");
  const navUsername = document.getElementById("navUsername");
  const dropdownUsername = document.getElementById("dropdownUsername");
  const dropdownEmail = document.getElementById("dropdownEmail");

  if (navLoginBtn) navLoginBtn.style.display = "none";
  if (heroSignupBtn) heroSignupBtn.style.display = "none";
  if (heroDashboardBtn) heroDashboardBtn.style.display = "block";
  if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
  if (mobileSignupBtn) mobileSignupBtn.style.display = "none";
  if (mobileDashboardBtn) mobileDashboardBtn.style.display = "block";
  if (userMenu) userMenu.style.display = "block";

  const displayName = currentProfile?.username || "Trainer";
  if (navUsername) navUsername.textContent = displayName;
  if (dropdownUsername) dropdownUsername.textContent = displayName;
  if (dropdownEmail) dropdownEmail.textContent = currentUser?.email || "";
}

function updateNavigationForLoggedOutUser() {
  const navLoginBtn = document.getElementById("navLoginBtn");
  const heroSignupBtn = document.getElementById("heroSignupBtn");
  const heroDashboardBtn = document.getElementById("heroDashboardBtn");
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const mobileSignupBtn = document.getElementById("mobileSignupBtn");
  const mobileDashboardBtn = document.getElementById("mobileDashboardBtn");
  const userMenu = document.getElementById("userMenu");

  if (navLoginBtn) navLoginBtn.style.display = "block";
  if (heroSignupBtn) heroSignupBtn.style.display = "block";
  if (heroDashboardBtn) heroDashboardBtn.style.display = "none";
  if (mobileLoginBtn) mobileLoginBtn.style.display = "block";
  if (mobileSignupBtn) mobileSignupBtn.style.display = "block";
  if (mobileDashboardBtn) mobileDashboardBtn.style.display = "none";
  if (userMenu) userMenu.style.display = "none";
}

// ===================================
// USER MENU DROPDOWN
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  const userMenuTrigger = document.getElementById("userMenuTrigger");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userMenuTrigger) {
    userMenuTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle("active");
      this.classList.toggle("active");
    });
  }

  document.addEventListener("click", function () {
    if (userDropdown && userDropdown.classList.contains("active")) {
      userDropdown.classList.remove("active");
      if (userMenuTrigger) userMenuTrigger.classList.remove("active");
    }
  });

  if (userDropdown) {
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        console.log("Logged out successfully");

        userDropdown.classList.remove("active");
        userMenuTrigger.classList.remove("active");

        window.location.reload();
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to log out. Please try again.");
      }
    });
  }
});

// ===================================
// USERNAME MODAL FUNCTIONALITY
// ===================================

const usernameModalOverlay = document.getElementById("usernameModalOverlay");
const usernameModal = document.getElementById("usernameModal");
const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");
const usernameStatus = document.getElementById("usernameStatus");
const usernameSuggestions = document.getElementById("usernameSuggestions");
const suggestionsList = document.getElementById("suggestionsList");

let usernameCheckTimeout = null;

function openUsernameModal() {
  if (usernameModalOverlay && usernameModal) {
    usernameModalOverlay.classList.add("active");
    usernameModal.classList.add("active");
    document.body.classList.add("modal-open");

    setTimeout(() => {
      if (usernameInput) usernameInput.focus();
    }, 100);
  }
}

function closeUsernameModal() {
  if (usernameModalOverlay && usernameModal) {
    usernameModalOverlay.classList.remove("active");
    usernameModal.classList.remove("active");
    document.body.classList.remove("modal-open");

    if (usernameForm) usernameForm.reset();
    if (usernameStatus) {
      usernameStatus.className = "username-status";
      usernameStatus.textContent = "";
    }
    if (usernameSuggestions) usernameSuggestions.style.display = "none";
  }
}

if (usernameInput) {
  usernameInput.addEventListener("input", async function () {
    const username = this.value.trim();

    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }

    if (usernameSuggestions) usernameSuggestions.style.display = "none";

    if (username.length < 3) {
      usernameStatus.className = "username-status";
      usernameStatus.textContent = "";
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      usernameStatus.className = "username-status taken";
      usernameStatus.textContent =
        "⚠️ Username can only contain letters, numbers, and underscores";
      return;
    }

    usernameStatus.className = "username-status checking";
    usernameStatus.textContent = "⏳ Checking availability...";

    usernameCheckTimeout = setTimeout(async () => {
      await checkUsernameAvailability(username);
    }, 500);
  });
}

async function checkUsernameAvailability(username) {
  try {
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      usernameStatus.className = "username-status taken";
      usernameStatus.textContent = "❌ Username already taken";

      generateUsernameSuggestions(username);
    } else {
      usernameStatus.className = "username-status available";
      usernameStatus.textContent = "✅ Username available!";
    }
  } catch (error) {
    console.error("Error checking username:", error);
    usernameStatus.className = "username-status taken";
    usernameStatus.textContent = "⚠️ Error checking username";
  }
}

function generateUsernameSuggestions(baseUsername) {
  const suggestions = [
    `${baseUsername}${Math.floor(Math.random() * 100)}`,
    `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
    `${baseUsername}_trainer`,
    `epic_${baseUsername}`,
    `${baseUsername}_master`,
  ];

  suggestionsList.innerHTML = "";
  suggestions.forEach(suggestion => {
    const chip = document.createElement("div");
    chip.className = "suggestion-chip";
    chip.textContent = suggestion;
    chip.addEventListener("click", function () {
      usernameInput.value = suggestion;
      usernameInput.dispatchEvent(new Event("input"));
      usernameSuggestions.style.display = "none";
    });
    suggestionsList.appendChild(chip);
  });

  usernameSuggestions.style.display = "block";
}

if (usernameForm) {
  usernameForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const submitBtn = document.getElementById("usernameSubmitBtn");

    if (username.length < 3) {
      showError("usernameInput", "Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError(
        "usernameInput",
        "Username can only contain letters, numbers, and underscores",
      );
      return;
    }

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient
        .from("user_profiles")
        .update({ username: username })
        .eq("id", currentUser.id);

      if (error) throw error;

      await supabaseClient.from("activity_logs").insert({
        user_id: currentUser.id,
        action_type: "username_created",
        description: `Username set to: ${username}`,
      });

      console.log("Username updated successfully:", username);

      currentProfile.username = username;

      closeUsernameModal();

      updateNavigationForLoggedInUser();

      window.location.reload();
    } catch (error) {
      console.error("Error updating username:", error);
      showError(
        "usernameInput",
        error.message || "Failed to set username. Please try again.",
      );
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });
}

// ===================================
// 2. ASSET PRELOADING
// ===================================

function preloadTypeSprites() {
  const typeSprites = ["fire", "water", "electric", "ice", "dark", "grass"];

  typeSprites.forEach(type => {
    const img = new Image();
    img.src = `./assets/types/${type}.png`;
    img.onerror = function () {
      console.warn(`Failed to load sprite: ${type}.png`);
    };
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", preloadTypeSprites);
} else {
  preloadTypeSprites();
}

// ===================================
// 2. IMAGE ERROR HANDLING
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  const typeSprites = document.querySelectorAll(".type-sprite");

  typeSprites.forEach(sprite => {
    sprite.addEventListener("error", function () {
      console.warn(`Failed to load image: ${this.src}`);
      this.style.display = "none";
      const parent = this.parentElement;
      if (parent && parent.classList.contains("creature-image")) {
        const fallback = document.createElement("div");
        fallback.className = "creature-silhouette";
        fallback.style.fontSize = "4rem";

        const card = this.closest(".creature-card");
        const dataType = card ? card.getAttribute("data-type") : "";
        fallback.textContent = typeEmojis[dataType] || "✨";

        parent.appendChild(fallback);
      }
    });
  });
});

// ===================================
// 3. EMAIL & PASSWORD VALIDATION
// ===================================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: minLength && hasUppercase && hasNumber && hasSpecial,
    minLength,
    hasUppercase,
    hasNumber,
    hasSpecial,
  };
}

// ===================================
// 4. MODAL FUNCTIONALITY
// ===================================

const modalOverlay = document.getElementById("modalOverlay");
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");

function openModal(modalType) {
  const modal = modalType === "login" ? loginModal : signupModal;

  modalOverlay.classList.add("active");
  modal.classList.add("active");
  document.body.classList.add("modal-open");

  setTimeout(() => {
    const firstInput = modal.querySelector(".form-input");
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeModal() {
  modalOverlay.classList.remove("active");
  loginModal.classList.remove("active");
  signupModal.classList.remove("active");
  document.body.classList.remove("modal-open");

  clearForm("login");
  clearForm("signup");
}

function clearForm(formType) {
  const form = document.getElementById(`${formType}Form`);
  if (!form) return;

  form.reset();

  form.querySelectorAll(".form-error-msg").forEach(msg => {
    msg.classList.remove("visible");
    msg.textContent = "";
  });

  form.querySelectorAll(".form-input").forEach(input => {
    input.classList.remove("error");
  });

  const message = document.getElementById(`${formType}Message`);
  if (message) {
    message.classList.remove("visible", "success", "error");
    message.textContent = "";
  }

  const submitBtn = form.querySelector(".form-submit-btn");
  if (submitBtn) {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

function switchModal(fromType, toType) {
  const fromModal = document.getElementById(`${fromType}Modal`);
  const toModal = document.getElementById(`${toType}Modal`);

  fromModal.classList.remove("active");
  toModal.classList.add("active");

  clearForm(fromType);

  setTimeout(() => {
    const firstInput = toModal.querySelector(".form-input");
    if (firstInput) firstInput.focus();
  }, 100);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-modal]").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const modalType = this.getAttribute("data-modal");
      openModal(modalType);
    });
  });

  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });

  document
    .getElementById("switchToSignup")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      switchModal("login", "signup");
    });

  document
    .getElementById("switchToLogin")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      switchModal("signup", "login");
    });

  document
    .getElementById("heroDashboardBtn")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });

  document
    .getElementById("mobileDashboardBtn")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });

  document
    .getElementById("forgotPasswordLink")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Password reset requested (placeholder)");
      showMessage(
        "login",
        "Password reset functionality coming soon!",
        "error",
      );
    });
});

// ===================================
// 5. FORM VALIDATION
// ===================================

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorMsg = document.getElementById(`${inputId}Error`);

  if (input) input.classList.add("error");
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.classList.add("visible");
  }
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const errorMsg = document.getElementById(`${inputId}Error`);

  if (input) input.classList.remove("error");
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.classList.remove("visible");
  }
}

function showMessage(formType, message, type) {
  const messageEl = document.getElementById(`${formType}Message`);
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.remove("success", "error");
  messageEl.classList.add("visible", type);
}

function clearAllErrors(formType) {
  const form = document.getElementById(`${formType}Form`);
  if (!form) return;

  form.querySelectorAll(".form-error-msg").forEach(msg => {
    msg.classList.remove("visible");
    msg.textContent = "";
  });

  form.querySelectorAll(".form-input").forEach(input => {
    input.classList.remove("error");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".form-input").forEach(input => {
    input.addEventListener("input", function () {
      if (this.classList.contains("error")) {
        clearError(this.id);
      }
    });
  });
});

// ===================================
// 6. LOGIN FORM HANDLING
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllErrors("login");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    let hasError = false;

    if (!email) {
      showError("loginEmail", "Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      showError("loginEmail", "Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      showError("loginPassword", "Password is required");
      hasError = true;
    }

    if (hasError) return;

    await handleLogin(email, password);
  });
});

async function handleLogin(email, password) {
  const submitBtn = document.getElementById("loginSubmitBtn");

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;

    showMessage("login", "Login successful!", "success");

    console.log("Login successful:", data.user.email);

    setTimeout(() => {
      closeModal();
    }, 800);
  } catch (error) {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;

    console.error("Login error:", error);
    showMessage(
      "login",
      error.message || "Login failed. Please try again.",
      "error",
    );
  }
}

// ===================================
// 7. SIGNUP FORM HANDLING
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllErrors("signup");

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const termsChecked = document.getElementById("termsCheckbox").checked;

    let hasError = false;

    if (!email) {
      showError("signupEmail", "Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      showError("signupEmail", "Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      showError("signupPassword", "Password is required");
      hasError = true;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        let errorMsg = "Password must contain: ";
        const missing = [];
        if (!passwordValidation.minLength) missing.push("8+ characters");
        if (!passwordValidation.hasUppercase) missing.push("uppercase letter");
        if (!passwordValidation.hasNumber) missing.push("number");
        if (!passwordValidation.hasSpecial) missing.push("special character");
        errorMsg += missing.join(", ");
        showError("signupPassword", errorMsg);
        hasError = true;
      }
    }

    if (!termsChecked) {
      showError("termsCheckbox", "You must agree to the Terms of Service");
      hasError = true;
    }

    if (hasError) return;

    await handleSignup(email, password);
  });
});

async function handleSignup(email, password) {
  const submitBtn = document.getElementById("signupSubmitBtn");

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: "player_" + Math.random().toString(36).substring(7),
        },
      },
    });

    if (error) throw error;

    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;

    showMessage("signup", "Account created successfully!", "success");

    console.log("Signup successful:", data.user.email);

    currentUser = data.user;
    await loadUserProfile(data.user.id);

    closeModal();
    openUsernameModal();
  } catch (error) {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;

    console.error("Signup error:", error);
    showMessage(
      "signup",
      error.message || "Signup failed. Please try again.",
      "error",
    );
  }
}

// ===================================
// NAVIGATION SCROLL EFFECT
// ===================================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", function () {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ==============================
// PARTICLE BACKGROUND ANIMATION
// ==============================

function createParticles() {
  const particleContainer = document.getElementById("particleContainer");
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    const size = Math.random() * 4 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particle.style.left = `${Math.random() * 100}%`;

    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 5;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    particle.style.opacity = Math.random() * 0.5 + 0.2;

    particleContainer.appendChild(particle);
  }
}

// ===================================
// 6. PAGE LOAD ANIMATIONS
// ===================================

window.addEventListener("load", function () {
  createParticles();

  document.body.classList.add("loaded");
});

// ===================================
// 7. SCROLL INDICATOR FUNCTIONALITY
// ===================================

const scrollIndicator = document.querySelector(".scroll-indicator");

if (scrollIndicator) {
  scrollIndicator.addEventListener("click", function () {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: "smooth",
    });
  });

  window.addEventListener("scroll", function () {
    if (window.scrollY > 100) {
      scrollIndicator.style.opacity = "0";
      scrollIndicator.style.pointerEvents = "none";
    } else {
      scrollIndicator.style.opacity = "1";
      scrollIndicator.style.pointerEvents = "auto";
    }
  });
}

// ===================================
// 8. ADDITIONAL FORM ENHANCEMENTS
// ===================================

{
  const emailInput =
    document.getElementById("signupEmail") ||
    document.getElementById("loginEmail");
  const formError = document.querySelector(".form-error-msg");

  if (emailInput) {
    emailInput.addEventListener("input", function () {
      if (emailInput.classList.contains("error")) {
        emailInput.classList.remove("error");
        if (formError) formError.textContent = "";
      }
    });

    emailInput.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    emailInput.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");
    });
  }
}

// ===================================
// 9. PERFORMANCE OPTIMIZATION
// ===================================

let scrollTimeout;
window.addEventListener(
  "scroll",
  function () {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(function () {});
  },
  { passive: true },
);

// ===================================
// 10. ACCESSIBILITY ENHANCEMENTS
// ===================================

{
  const modal =
    document.getElementById("loginModal") ||
    document.getElementById("signupModal");
  if (modal) {
    modal.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("active")) return;

      if (e.key === "Tab") {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
}

// ===================================
// 11. FEATURES SECTION SCROLL ANIMATION
// ===================================

function initFeaturesAnimation() {
  const featuresSection = document.querySelector("#features");
  const featuresHeading = document.querySelector(".features-heading");
  const featuresSubheading = document.querySelector(".features-subheading");
  const featureCards = document.querySelectorAll(".feature-card");

  if (!featuresSection) return;

  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  const observerCallback = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (featuresHeading) {
          featuresHeading.classList.add("animate");
        }

        if (featuresSubheading) {
          featuresSubheading.classList.add("animate");
        }

        featureCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
          }, 150 * index);
        });

        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  observer.observe(featuresSection);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFeaturesAnimation);
} else {
  initFeaturesAnimation();
}

// ===================================
// SHOWCASE - 3D CARD CAROUSEL
// ===================================

const CAROUSEL_POKEMON = [
  {
    name: "Pikachu",
    stage: "Stage 2",
    folder: "secondForm",
    type: "Electric",
    hp: 274,
    atk: 55,
    def: 40,
    spd: 90,
    gradient:
      "linear-gradient(145deg, #fff9c4 0%, #ffee58 30%, #fdd835 60%, #f9a825 100%)",
  },
  {
    name: "Squirtle",
    stage: "Base",
    folder: "baseForm",
    type: "Water",
    hp: 292,
    atk: 48,
    def: 65,
    spd: 43,
    gradient:
      "linear-gradient(145deg, #e3f2fd 0%, #90caf9 30%, #42a5f5 60%, #1e88e5 100%)",
  },
  {
    name: "Charmander",
    stage: "Base",
    folder: "baseForm",
    type: "Fire",
    hp: 282,
    atk: 52,
    def: 43,
    spd: 65,
    gradient:
      "linear-gradient(145deg, #fff3e0 0%, #ffcc80 30%, #ff9800 60%, #ef6c00 100%)",
  },
  {
    name: "Bulbasaur",
    stage: "Base",
    folder: "baseForm",
    type: "Grass",
    hp: 294,
    atk: 49,
    def: 49,
    spd: 45,
    gradient:
      "linear-gradient(145deg, #e8f5e9 0%, #a5d6a7 30%, #66bb6a 60%, #2e7d32 100%)",
  },
  {
    name: "Eevee",
    stage: "Base",
    folder: "baseForm",
    type: "Normal",
    hp: 310,
    atk: 55,
    def: 50,
    spd: 55,
    gradient:
      "linear-gradient(145deg, #efebe9 0%, #d7ccc8 30%, #a1887f 60%, #795548 100%)",
  },
  {
    name: "Dragonite",
    stage: "Stage 3",
    folder: "thirdForm",
    type: "Dragon",
    hp: 386,
    atk: 134,
    def: 95,
    spd: 80,
    gradient:
      "linear-gradient(145deg, #ede7f6 0%, #b39ddb 30%, #7e57c2 60%, #4527a0 100%)",
  },
  {
    name: "Charizard",
    stage: "Stage 3",
    folder: "thirdForm",
    type: "Fire",
    hp: 360,
    atk: 84,
    def: 78,
    spd: 100,
    gradient:
      "linear-gradient(145deg, #fbe9e7 0%, #ff8a65 30%, #f4511e 60%, #bf360c 100%)",
  },
  {
    name: "Gengar",
    stage: "Stage 3",
    folder: "thirdForm",
    type: "Ghost",
    hp: 324,
    atk: 65,
    def: 60,
    spd: 110,
    gradient:
      "linear-gradient(145deg, #f3e5f5 0%, #ce93d8 30%, #9c27b0 60%, #6a1b9a 100%)",
  },
  {
    name: "Jolteon",
    stage: "Stage 3",
    folder: "thirdForm",
    type: "Electric",
    hp: 334,
    atk: 65,
    def: 60,
    spd: 130,
    gradient:
      "linear-gradient(145deg, #fffde7 0%, #fff176 30%, #fdd835 60%, #f57f17 100%)",
  },
  {
    name: "Blastoise",
    stage: "Stage 3",
    folder: "thirdForm",
    type: "Water",
    hp: 362,
    atk: 83,
    def: 100,
    spd: 78,
    gradient:
      "linear-gradient(145deg, #e1f5fe 0%, #4fc3f7 30%, #0288d1 60%, #01579b 100%)",
  },
];

const TYPE_COLORS = {
  Fire: "#F08030",
  Water: "#6890F0",
  Grass: "#78C850",
  Electric: "#F8D030",
  Dragon: "#7038F8",
  Ghost: "#705898",
  Normal: "#A8A878",
  Rock: "#B8A038",
  Dark: "#705848",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initCardCarousel() {
  const showcaseSection = document.querySelector("#showcase");
  const showcaseHeading = document.querySelector(".showcase-heading");
  const showcaseSubheading = document.querySelector(".showcase-subheading");
  const track = document.getElementById("carouselTrack");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  if (!showcaseSection || !track) return;

  let cards = [];
  let activeIndex = 0;
  let autoRotateTimer = null;
  let isPaused = false;
  const AUTO_ROTATE_INTERVAL = 3000;
  const VISIBLE_COUNT = 7;

  function buildCards(pokemon) {
    track.innerHTML = "";
    cards = [];

    pokemon.forEach((pkmn, i) => {
      const card = document.createElement("div");
      card.className = "carousel-card";
      card.setAttribute("data-index", i);

      card.innerHTML = `
        <div class="carousel-card-inner" style="background: ${pkmn.gradient};">
          <div class="carousel-holo-shine"></div>
          <div class="carousel-foil"></div>
          <div class="carousel-sparkles">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="carousel-card-header">
            <span class="carousel-card-stage">${pkmn.stage}</span>
            <span class="carousel-card-hp">HP ${pkmn.hp}</span>
          </div>
          <div class="carousel-card-image">
            <img src="assets/${pkmn.folder}/${pkmn.name}.gif" alt="${pkmn.name}" loading="lazy" />
          </div>
          <div class="carousel-card-info">
            <h3 class="carousel-card-name">${pkmn.name}</h3>
            <span class="carousel-card-type" style="background: ${TYPE_COLORS[pkmn.type] || "#A8A878"};">${pkmn.type}</span>
            <div class="carousel-card-stats">
              <div class="carousel-card-stat"><span class="carousel-card-stat-label">ATK</span><span class="carousel-card-stat-val">${pkmn.atk}</span></div>
              <div class="carousel-card-stat"><span class="carousel-card-stat-label">DEF</span><span class="carousel-card-stat-val">${pkmn.def}</span></div>
              <div class="carousel-card-stat"><span class="carousel-card-stat-label">SPD</span><span class="carousel-card-stat-val">${pkmn.spd}</span></div>
            </div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        goToCard(i);
      });

      track.appendChild(card);
      cards.push(card);
    });

    activeIndex = Math.floor(pokemon.length / 2);
    layoutCards();
  }

  function layoutCards() {
    const total = cards.length;
    const half = Math.floor(VISIBLE_COUNT / 2);

    cards.forEach((card, i) => {
      let offset = i - activeIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const absOffset = Math.abs(offset);

      if (absOffset > half) {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        card.style.transform = `translate(-50%, -50%) translateX(${offset * 200}px) scale(0.5) rotateY(${offset > 0 ? -40 : 40}deg)`;
        card.style.zIndex = "0";
        card.classList.remove("active");
        return;
      }

      const xSpacing = getXSpacing();
      const translateX = offset * xSpacing;

      const translateY = absOffset * absOffset * 8;

      const rotateY = offset * -8;

      const scale = 1 - absOffset * 0.1;

      const zIndex = VISIBLE_COUNT - absOffset;

      const opacity = 1 - absOffset * 0.15;

      card.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.zIndex = zIndex;
      card.style.opacity = opacity;
      card.style.pointerEvents = absOffset === 0 ? "auto" : "auto";

      if (absOffset === 0) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  function getXSpacing() {
    const w = window.innerWidth;
    if (w < 500) return 80;
    if (w < 768) return 110;
    if (w < 1024) return 140;
    return 165;
  }

  function goToCard(index) {
    activeIndex = index;
    layoutCards();
    resetAutoRotate();
  }

  function nextCard() {
    activeIndex = (activeIndex + 1) % cards.length;
    layoutCards();
  }

  function prevCard() {
    activeIndex = (activeIndex - 1 + cards.length) % cards.length;
    layoutCards();
  }

  let currentPokemon = CAROUSEL_POKEMON;

  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(() => {
      if (!isPaused) nextCard();
    }, AUTO_ROTATE_INTERVAL);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
  }

  const scene = document.getElementById("carouselScene");
  if (scene) {
    scene.addEventListener("mouseenter", () => {
      isPaused = true;
    });
    scene.addEventListener("mouseleave", () => {
      isPaused = false;
    });
  }

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      prevCard();
      resetAutoRotate();
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      nextCard();
      resetAutoRotate();
    });

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      track.style.opacity = "0";
      track.style.transform = "scale(0.95)";

      setTimeout(() => {
        currentPokemon = shuffleArray(CAROUSEL_POKEMON);
        buildCards(currentPokemon);
        track.style.opacity = "1";
        track.style.transform = "scale(1)";
        startAutoRotate();
      }, 350);
    });
    track.style.transition = "opacity 0.35s ease, transform 0.35s ease";
  }

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") {
      prevCard();
      resetAutoRotate();
    }
    if (e.key === "ArrowRight") {
      nextCard();
      resetAutoRotate();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;

  if (scene) {
    scene.addEventListener(
      "touchstart",
      e => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    scene.addEventListener(
      "touchend",
      e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextCard();
          else prevCard();
          resetAutoRotate();
        }
      },
      { passive: true },
    );
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutCards, 150);
  });

  currentPokemon = [...CAROUSEL_POKEMON];
  buildCards(currentPokemon);
  startAutoRotate();

  const observerCallback = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (showcaseHeading) showcaseHeading.classList.add("animate");
        if (showcaseSubheading) showcaseSubheading.classList.add("animate");
        observer.unobserve(entry.target);
      }
    });
  };
  const observer = new IntersectionObserver(observerCallback, {
    threshold: 0.15,
  });
  observer.observe(showcaseSection);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCardCarousel);
} else {
  initCardCarousel();
}

// ===================================
// HOW IT WORKS - SCROLL ANIMATION
// ===================================

function initHowItWorksAnimation() {
  const howItWorksSection = document.querySelector("#how-it-works");
  const howItWorksHeading = document.querySelector(".how-it-works-heading");
  const howItWorksSubheading = document.querySelector(
    ".how-it-works-subheading",
  );
  const stepCards = document.querySelectorAll(".step-card");

  if (!howItWorksSection) return;

  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  const observerCallback = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (howItWorksHeading) {
          howItWorksHeading.classList.add("animate");
        }

        if (howItWorksSubheading) {
          howItWorksSubheading.classList.add("animate");
        }

        stepCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
          }, 200 * index);
        });

        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  observer.observe(howItWorksSection);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHowItWorksAnimation);
} else {
  initHowItWorksAnimation();
}

// ===================================
// 15. SOCIAL PROOF SECTION ANIMATION
// ===================================

function initSocialProofAnimation() {
  const socialProofSection = document.querySelector("#social-proof");
  const socialProofHeading = document.querySelector(".social-proof-heading");
  const socialProofSubheading = document.querySelector(
    ".social-proof-subheading",
  );
  const statCards = document.querySelectorAll(".stat-card");
  const testimonialCards = document.querySelectorAll(".testimonial-card");

  if (!socialProofSection) return;

  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  const observerCallback = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (socialProofHeading) {
          socialProofHeading.classList.add("animate");
        }

        if (socialProofSubheading) {
          socialProofSubheading.classList.add("animate");
        }

        statCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
            const numberEl = card.querySelector(".stat-number");
            const target = numberEl.getAttribute("data-target");
            if (target) {
              animateCounter(numberEl, parseInt(target), 2000);
            }
          }, 100 * index);
        });

        testimonialCards.forEach((card, index) => {
          setTimeout(
            () => {
              card.classList.add("animate");
            },
            150 * index + 400,
          );
        });

        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  observer.observe(socialProofSection);
}

function animateCounter(element, target, duration) {
  let current = 0;
  const increment = target / (duration / 16);
  const suffix = target >= 1000 ? "+" : "";

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString() + suffix;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString() + suffix;
    }
  }, 16);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSocialProofAnimation);
} else {
  initSocialProofAnimation();
}

// ===================================
// SMOOTH SCROLL FOR ALL LINKS
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href === "#" || href === "#!") return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ===================================
// OCIAL AUTHENTICATION
// ===================================

const googleLoginBtn = document.getElementById("login-google-btn");
const facebookLoginBtn = document.getElementById("login-facebook-btn");
const googleSignupBtn = document.getElementById("signup-google-btn");
const facebookSignupBtn = document.getElementById("signup-facebook-btn");

// ========== GOOGLE AUTHENTICATION ==========

async function handleGoogleAuth() {
  console.log("Google authentication initiated");

  // Show loading state
  const googleButtons = document.querySelectorAll(".btn-google");
  googleButtons.forEach(btn => {
    btn.classList.add("loading");
    btn.disabled = true;
  });

  try {
    // PLACEHOLDER: Replace with actual Google OAuth implementation
    // This is where you'll integrate with Supabase or Firebase Auth

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Example with Supabase (uncomment when ready):
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    //   options: {
    //     redirectTo: `${window.location.origin}/auth/callback`
    //   }
    // });

    // if (error) throw error;

    // SUCCESS
    alert("Google authentication successful! (Integration needed)");
    closeAllModals();
  } catch (error) {
    console.error("Google auth error:", error);
    alert("Failed to authenticate with Google. Please try again.");
  } finally {
    googleButtons.forEach(btn => {
      btn.classList.remove("loading");
      btn.disabled = false;
    });
  }
}

// ========== FACEBOOK AUTHENTICATION ==========

async function handleFacebookAuth() {
  console.log("Facebook authentication initiated");

  const facebookButtons = document.querySelectorAll(".btn-facebook");
  facebookButtons.forEach(btn => {
    btn.classList.add("loading");
    btn.disabled = true;
  });

  try {
    // PLACEHOLDER: Replace with actual Facebook OAuth implementation

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Example with Supabase (uncomment when ready):
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'facebook',
    //   options: {
    //     redirectTo: `${window.location.origin}/auth/callback`
    //   }
    // });

    // if (error) throw error;

    alert("Facebook authentication successful! (Integration needed)");
    closeAllModals();
  } catch (error) {
    console.error("Facebook auth error:", error);
    alert("Failed to authenticate with Facebook. Please try again.");
  } finally {
    facebookButtons.forEach(btn => {
      btn.classList.remove("loading");
      btn.disabled = false;
    });
  }
}

// ========== ATTACH EVENT LISTENERS ==========

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", handleGoogleAuth);
}
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", handleGoogleAuth);
}

if (facebookLoginBtn) {
  facebookLoginBtn.addEventListener("click", handleFacebookAuth);
}
if (facebookSignupBtn) {
  facebookSignupBtn.addEventListener("click", handleFacebookAuth);
}

// ========== OAUTH CALLBACK HANDLER ==========

window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const error = urlParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    alert("Authentication failed. Please try again.");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (accessToken) {
    console.log("OAuth successful, access token received");

    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// ========================
// CONSOLE WELCOME MESSAGE
// ========================

console.log(
  "%c NOMEKOP BEQUEST ",
  "color: #F4D03F; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 0 #D4AC0D;",
);
console.log(
  "%cWelcome, Trainer! Ready to own your adventure?",
  "color: #5DADE2; font-size: 14px;",
);
console.log("%cLaunching Q2 2026 🚀", "color: #1ABC9C; font-size: 12px;");
