// ===================================
// 1. ASSET PRELOADING
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

// Preload sprites on page load
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
// 3. EMAIL VALIDATION
// ===================================

function validateEmail(email) {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ===================================
// 4. FORM SUBMISSION HANDLING
// ===================================

const form = document.getElementById("waitlistForm");
const emailInput = document.getElementById("emailInput");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");
const modal = document.getElementById("successModal");
const modalClose = document.getElementById("modalClose");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Clear previous messages
  formError.textContent = "";
  formSuccess.textContent = "";
  emailInput.classList.remove("error");

  const email = emailInput.value.trim();

  // Validate email
  if (!email) {
    formError.textContent = "Please enter your email address";
    emailInput.classList.add("error");
    return;
  }

  if (!validateEmail(email)) {
    formError.textContent = "Please enter a valid email address";
    emailInput.classList.add("error");
    return;
  }

  // Simulate form submission (replace with actual API call)
  submitToWaitlist(email);
});

function submitToWaitlist(email) {
  // Show loading state (optional)
  const submitBtn = form.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Joining...";
  submitBtn.disabled = true;

  // Simulate API call with timeout
  setTimeout(() => {
    // Success!
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Clear form
    emailInput.value = "";

    // Show success modal
    showSuccessModal();

    // Log to console (replace with actual API call)
    console.log("Email submitted to waitlist:", email);

    // Here you would typically send to your backend:
    // fetch('/api/waitlist', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email })
    // })
    // .then(response => response.json())
    // .then(data => showSuccessModal())
    // .catch(error => {
    //     formError.textContent = 'Something went wrong. Please try again.';
    // });
  }, 1000);
}

function showSuccessModal() {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Modal close handlers
modalClose.addEventListener("click", closeSuccessModal);
modal.addEventListener("click", function (e) {
  if (e.target === modal) {
    closeSuccessModal();
  }
});

// Close modal on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    closeSuccessModal();
  }
});

// ===================================
// 3. SMOOTH SCROLL FOR NAVIGATION CTA
// ===================================

const navCTA = document.getElementById("navCTA");
const heroSection = document.getElementById("hero");

navCTA.addEventListener("click", function (e) {
  e.preventDefault();

  // Scroll to email input and focus
  emailInput.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  // Focus on email input after scroll
  setTimeout(() => {
    emailInput.focus();
  }, 500);
});

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
// 16. FINAL CTA FORM HANDLING
// ===================================

const finalForm = document.getElementById("finalCTAForm");
const finalEmailInput = document.getElementById("finalEmailInput");
const finalFormError = document.getElementById("finalFormError");

if (finalForm) {
  finalForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    finalFormError.textContent = "";
    finalEmailInput.classList.remove("error");

    const email = finalEmailInput.value.trim();

    // Validate email
    if (!email) {
      finalFormError.textContent = "Please enter your email address";
      finalEmailInput.classList.add("error");
      return;
    }

    if (!validateEmail(email)) {
      finalFormError.textContent = "Please enter a valid email address";
      finalEmailInput.classList.add("error");
      return;
    }

    // Submit to waitlist
    submitToWaitlist(email);
  });

  // Clear error on input
  finalEmailInput.addEventListener("input", function () {
    if (finalEmailInput.classList.contains("error")) {
      finalEmailInput.classList.remove("error");
      finalFormError.textContent = "";
    }
  });
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
// 18. CONSOLE WELCOME MESSAGE
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
