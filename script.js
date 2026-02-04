// ===================================
// 1. SUPABASE INITIALIZATION
// ===================================

const { createClient } = window.supabase;
const supabaseClient = createClient(
  "http://127.0.0.1:54321",
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
);

let currentUser = null;
let currentProfile = null;

// Check auth state on page load
window.addEventListener("DOMContentLoaded", async () => {
  await checkAuthState();
  initAuthListeners();
});

// Check current authentication state
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
  const userMenu = document.getElementById("userMenu");
  const navUsername = document.getElementById("navUsername");
  const dropdownUsername = document.getElementById("dropdownUsername");
  const dropdownEmail = document.getElementById("dropdownEmail");

  if (navLoginBtn) navLoginBtn.style.display = "none";
  if (userMenu) userMenu.style.display = "block";

  const displayName = currentProfile?.username || "Trainer";
  if (navUsername) navUsername.textContent = displayName;
  if (dropdownUsername) dropdownUsername.textContent = displayName;
  if (dropdownEmail) dropdownEmail.textContent = currentUser?.email || "";
}

function updateNavigationForLoggedOutUser() {
  const navLoginBtn = document.getElementById("navLoginBtn");
  const userMenu = document.getElementById("userMenu");

  if (navLoginBtn) navLoginBtn.style.display = "block";
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
  suggestions.forEach((suggestion) => {
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

      // Reload page immediately to show updated username
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

  typeSprites.forEach((type) => {
    const img = new Image();
    img.src = `../assets/types/${type}.png`;
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

// Add fallback handling for type sprite images
document.addEventListener("DOMContentLoaded", function () {
  const typeSprites = document.querySelectorAll(".type-sprite");

  typeSprites.forEach((sprite) => {
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
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters, one uppercase, one number, one special character
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

// Open modal
function openModal(modalType) {
  const modal = modalType === "login" ? loginModal : signupModal;

  modalOverlay.classList.add("active");
  modal.classList.add("active");
  document.body.classList.add("modal-open");

  // Focus on first input
  setTimeout(() => {
    const firstInput = modal.querySelector(".form-input");
    if (firstInput) firstInput.focus();
  }, 100);
}

// Close modal
function closeModal() {
  modalOverlay.classList.remove("active");
  loginModal.classList.remove("active");
  signupModal.classList.remove("active");
  document.body.classList.remove("modal-open");

  // Clear forms
  clearForm("login");
  clearForm("signup");
}

// Clear form
function clearForm(formType) {
  const form = document.getElementById(`${formType}Form`);
  if (!form) return;

  form.reset();

  // Clear error messages
  form.querySelectorAll(".form-error-msg").forEach((msg) => {
    msg.classList.remove("visible");
    msg.textContent = "";
  });

  // Clear error states
  form.querySelectorAll(".form-input").forEach((input) => {
    input.classList.remove("error");
  });

  // Clear form messages
  const message = document.getElementById(`${formType}Message`);
  if (message) {
    message.classList.remove("visible", "success", "error");
    message.textContent = "";
  }

  // Reset button state
  const submitBtn = form.querySelector(".form-submit-btn");
  if (submitBtn) {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

// Switch between login and signup
function switchModal(fromType, toType) {
  const fromModal = document.getElementById(`${fromType}Modal`);
  const toModal = document.getElementById(`${toType}Modal`);

  fromModal.classList.remove("active");
  toModal.classList.add("active");

  clearForm(fromType);

  // Focus on first input
  setTimeout(() => {
    const firstInput = toModal.querySelector(".form-input");
    if (firstInput) firstInput.focus();
  }, 100);
}

// Event listeners for modal triggers
document.addEventListener("DOMContentLoaded", function () {
  // All buttons with data-modal attribute
  document.querySelectorAll("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const modalType = this.getAttribute("data-modal");
      openModal(modalType);
    });
  });

  // Close buttons
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  // Close on overlay click
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });

  // Switch between modals
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

  // Forgot password link (placeholder)
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

// Show error message
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorMsg = document.getElementById(`${inputId}Error`);

  if (input) input.classList.add("error");
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.classList.add("visible");
  }
}

// Clear error message
function clearError(inputId) {
  const input = document.getElementById(inputId);
  const errorMsg = document.getElementById(`${inputId}Error`);

  if (input) input.classList.remove("error");
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.classList.remove("visible");
  }
}

// Show form message
function showMessage(formType, message, type) {
  const messageEl = document.getElementById(`${formType}Message`);
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.remove("success", "error");
  messageEl.classList.add("visible", type);
}

// Clear all errors in form
function clearAllErrors(formType) {
  const form = document.getElementById(`${formType}Form`);
  if (!form) return;

  form.querySelectorAll(".form-error-msg").forEach((msg) => {
    msg.classList.remove("visible");
    msg.textContent = "";
  });

  form.querySelectorAll(".form-input").forEach((input) => {
    input.classList.remove("error");
  });
}

// Real-time validation on input
document.addEventListener("DOMContentLoaded", function () {
  // Clear errors on input
  document.querySelectorAll(".form-input").forEach((input) => {
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

    // Validate email
    if (!email) {
      showError("loginEmail", "Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      showError("loginEmail", "Please enter a valid email address");
      hasError = true;
    }

    // Validate password
    if (!password) {
      showError("loginPassword", "Password is required");
      hasError = true;
    }

    if (hasError) return;

    // Submit login
    await handleLogin(email, password);
  });
});

async function handleLogin(email, password) {
  const submitBtn = document.getElementById("loginSubmitBtn");

  // Show loading state
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

    // Close modal - auth listener will handle the rest
    setTimeout(() => {
      closeModal();
      // Auth listener will check if username is set and update navigation
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
    const confirmPassword = document.getElementById(
      "signupConfirmPassword",
    ).value;
    const termsChecked = document.getElementById("termsCheckbox").checked;

    let hasError = false;

    // Validate email
    if (!email) {
      showError("signupEmail", "Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      showError("signupEmail", "Please enter a valid email address");
      hasError = true;
    }

    // Validate password
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

    // Validate confirm password
    if (!confirmPassword) {
      showError("signupConfirmPassword", "Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      showError("signupConfirmPassword", "Passwords do not match");
      hasError = true;
    }

    // Validate terms
    if (!termsChecked) {
      showError("termsCheckbox", "You must agree to the Terms of Service");
      hasError = true;
    }

    if (hasError) return;

    // Submit signup
    await handleSignup(email, password);
  });
});

async function handleSignup(email, password) {
  const submitBtn = document.getElementById("signupSubmitBtn");

  // Show loading state
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

    // Update current user and profile
    currentUser = data.user;
    await loadUserProfile(data.user.id);

    // Close signup modal and immediately show username modal
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
// 3. SMOOTH SCROLL FOR NAVIGATION CTA
// ===================================

// Note: Nav CTA now opens signup modal instead of scrolling

// ===================================
// 4. NAVIGATION SCROLL EFFECT
// ===================================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", function () {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ===================================
// 5. PARTICLE BACKGROUND ANIMATION
// ===================================

function createParticles() {
  const particleContainer = document.getElementById("particleContainer");
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    // Random size
    const size = Math.random() * 4 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random horizontal position
    particle.style.left = `${Math.random() * 100}%`;

    // Random animation duration and delay
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 5;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    // Random opacity
    particle.style.opacity = Math.random() * 0.5 + 0.2;

    particleContainer.appendChild(particle);
  }
}

// ===================================
// 6. PAGE LOAD ANIMATIONS
// ===================================

window.addEventListener("load", function () {
  // Create particles
  createParticles();

  // Add loaded class to body for any additional animations
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

  // Hide scroll indicator on scroll
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

// Clear error on input
emailInput.addEventListener("input", function () {
  if (emailInput.classList.contains("error")) {
    emailInput.classList.remove("error");
    formError.textContent = "";
  }
});

// Add focus/blur animations
emailInput.addEventListener("focus", function () {
  this.parentElement.classList.add("focused");
});

emailInput.addEventListener("blur", function () {
  this.parentElement.classList.remove("focused");
});

// ===================================
// 9. PERFORMANCE OPTIMIZATION
// ===================================

// Debounce scroll event for better performance
let scrollTimeout;
window.addEventListener(
  "scroll",
  function () {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(function () {
      // Scroll-based animations can go here
    });
  },
  { passive: true },
);

// ===================================
// 10. ACCESSIBILITY ENHANCEMENTS
// ===================================

// Trap focus in modal when open
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

// ===================================
// 11. FEATURES SECTION SCROLL ANIMATION
// ===================================

function initFeaturesAnimation() {
  const featuresSection = document.querySelector("#features");
  const featuresHeading = document.querySelector(".features-heading");
  const featuresSubheading = document.querySelector(".features-subheading");
  const featureCards = document.querySelectorAll(".feature-card");

  if (!featuresSection) return;

  // Intersection Observer options
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  // Callback function for when section enters viewport
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Animate heading
        if (featuresHeading) {
          featuresHeading.classList.add("animate");
        }

        // Animate subheading
        if (featuresSubheading) {
          featuresSubheading.classList.add("animate");
        }

        // Animate cards with stagger
        featureCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
          }, 150 * index); // 150ms stagger between each card
        });

        // Unobserve after animation to prevent re-triggering
        observer.unobserve(entry.target);
      }
    });
  };

  // Create observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe features section
  observer.observe(featuresSection);
}

// Initialize features animation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFeaturesAnimation);
} else {
  initFeaturesAnimation();
}

// ===================================
// 12. SHOWCASE SECTION SCROLL ANIMATION
// ===================================

function initShowcaseAnimation() {
  const showcaseSection = document.querySelector("#showcase");
  const showcaseHeading = document.querySelector(".showcase-heading");
  const showcaseSubheading = document.querySelector(".showcase-subheading");
  const creatureCards = document.querySelectorAll(".creature-card");

  if (!showcaseSection) return;

  // Intersection Observer options
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px",
  };

  // Callback function for when section enters viewport
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Animate heading
        if (showcaseHeading) {
          showcaseHeading.classList.add("animate");
        }

        // Animate subheading
        if (showcaseSubheading) {
          showcaseSubheading.classList.add("animate");
        }

        // Animate creature cards with stagger
        creatureCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
          }, 100 * index); // 100ms stagger between each card
        });

        // Unobserve after animation to prevent re-triggering
        observer.unobserve(entry.target);
      }
    });
  };

  // Create observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe showcase section
  observer.observe(showcaseSection);
}

// Initialize showcase animation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShowcaseAnimation);
} else {
  initShowcaseAnimation();
}

// ===================================
// 13. CREATURE CARD INTERACTION
// ===================================

// Add click interaction for creature cards (optional enhancement)
function initCreatureCardInteraction() {
  const creatureCards = document.querySelectorAll(".creature-card");

  creatureCards.forEach((card) => {
    card.addEventListener("click", function () {
      // Add a subtle pulse effect on click
      this.style.animation = "none";
      setTimeout(() => {
        this.style.animation = "";
      }, 10);

      // You can add more interactions here:
      // - Show creature details modal
      // - Flip card to show stats
      // - Play sound effect
      // - etc.

      console.log(
        "Clicked creature:",
        this.querySelector(".creature-name").textContent,
      );
    });
  });
}

// Initialize card interactions
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCreatureCardInteraction);
} else {
  initCreatureCardInteraction();
}

// ===================================
// 14. HOW IT WORKS SECTION SCROLL ANIMATION
// ===================================

function initHowItWorksAnimation() {
  const howItWorksSection = document.querySelector("#how-it-works");
  const howItWorksHeading = document.querySelector(".how-it-works-heading");
  const howItWorksSubheading = document.querySelector(
    ".how-it-works-subheading",
  );
  const stepCards = document.querySelectorAll(".step-card");

  if (!howItWorksSection) return;

  // Intersection Observer options
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  // Callback function for when section enters viewport
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Animate heading
        if (howItWorksHeading) {
          howItWorksHeading.classList.add("animate");
        }

        // Animate subheading
        if (howItWorksSubheading) {
          howItWorksSubheading.classList.add("animate");
        }

        // Animate step cards with stagger
        stepCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
          }, 200 * index); // 200ms stagger between each step
        });

        // Unobserve after animation to prevent re-triggering
        observer.unobserve(entry.target);
      }
    });
  };

  // Create observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe how-it-works section
  observer.observe(howItWorksSection);
}

// Initialize how-it-works animation when DOM is ready
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

  // Intersection Observer options
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  // Callback function for when section enters viewport
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Animate heading
        if (socialProofHeading) {
          socialProofHeading.classList.add("animate");
        }

        // Animate subheading
        if (socialProofSubheading) {
          socialProofSubheading.classList.add("animate");
        }

        // Animate stat cards with stagger
        statCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate");
            // Animate counter for numeric stats
            const numberEl = card.querySelector(".stat-number");
            const target = numberEl.getAttribute("data-target");
            if (target) {
              animateCounter(numberEl, parseInt(target), 2000);
            }
          }, 100 * index);
        });

        // Animate testimonials with stagger
        testimonialCards.forEach((card, index) => {
          setTimeout(
            () => {
              card.classList.add("animate");
            },
            150 * index + 400,
          ); // Start after stats
        });

        // Unobserve after animation
        observer.unobserve(entry.target);
      }
    });
  };

  // Create observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe social proof section
  observer.observe(socialProofSection);
}

// Counter animation function
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

// Initialize social proof animation
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSocialProofAnimation);
} else {
  initSocialProofAnimation();
}

// ===================================
// 17. SMOOTH SCROLL FOR ALL LINKS
// ===================================

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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
// 18. SOCIAL AUTHENTICATION
// ===================================

// Get all social auth buttons
const googleLoginBtn = document.getElementById("login-google-btn");
const facebookLoginBtn = document.getElementById("login-facebook-btn");
const googleSignupBtn = document.getElementById("signup-google-btn");
const facebookSignupBtn = document.getElementById("signup-facebook-btn");

// ========== GOOGLE AUTHENTICATION ==========

async function handleGoogleAuth() {
  console.log("Google authentication initiated");

  // Show loading state
  const googleButtons = document.querySelectorAll(".btn-google");
  googleButtons.forEach((btn) => {
    btn.classList.add("loading");
    btn.disabled = true;
  });

  try {
    // PLACEHOLDER: Replace with actual Google OAuth implementation
    // This is where you'll integrate with Supabase or Firebase Auth

    await new Promise((resolve) => setTimeout(resolve, 1500));

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
    // Remove loading state
    googleButtons.forEach((btn) => {
      btn.classList.remove("loading");
      btn.disabled = false;
    });
  }
}

// ========== FACEBOOK AUTHENTICATION ==========

async function handleFacebookAuth() {
  console.log("Facebook authentication initiated");

  // Show loading state
  const facebookButtons = document.querySelectorAll(".btn-facebook");
  facebookButtons.forEach((btn) => {
    btn.classList.add("loading");
    btn.disabled = true;
  });

  try {
    // PLACEHOLDER: Replace with actual Facebook OAuth implementation

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Example with Supabase (uncomment when ready):
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'facebook',
    //   options: {
    //     redirectTo: `${window.location.origin}/auth/callback`
    //   }
    // });

    // if (error) throw error;

    // SUCCESS
    alert("Facebook authentication successful! (Integration needed)");
    closeAllModals();
  } catch (error) {
    console.error("Facebook auth error:", error);
    alert("Failed to authenticate with Facebook. Please try again.");
  } finally {
    // Remove loading state
    facebookButtons.forEach((btn) => {
      btn.classList.remove("loading");
      btn.disabled = false;
    });
  }
}

// ========== ATTACH EVENT LISTENERS ==========

// Google auth buttons
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", handleGoogleAuth);
}
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", handleGoogleAuth);
}

// Facebook auth buttons
if (facebookLoginBtn) {
  facebookLoginBtn.addEventListener("click", handleFacebookAuth);
}
if (facebookSignupBtn) {
  facebookSignupBtn.addEventListener("click", handleFacebookAuth);
}

// ========== OAUTH CALLBACK HANDLER ==========

// Handle OAuth redirect callback
window.addEventListener("DOMContentLoaded", () => {
  // Check if URL has OAuth callback parameters
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const error = urlParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    alert("Authentication failed. Please try again.");
    // Redirect to clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (accessToken) {
    console.log("OAuth successful, access token received");
    // Handle successful authentication
    // Store token, redirect to dashboard, etc.

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// ===================================
// 19. CONSOLE WELCOME MESSAGE
// ===================================

console.log(
  "%c🎮 NOMEKOP BEQUEST 🎮",
  "color: #00fff5; font-size: 24px; font-weight: bold;",
);
console.log(
  "%cWelcome, Trainer! Ready to own your adventure?",
  "color: #8b5cf6; font-size: 14px;",
);
console.log("%cLaunching Q2 2026 🚀", "color: #ff006e; font-size: 12px;");
