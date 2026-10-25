// Initialize AOS and page behaviors
window.addEventListener("load", () => {
  if (window.AOS) {
    window.AOS.init({
      once: true,
      duration: 750,
      easing: "ease-out-cubic",
      // Respect the user's motion preferences (CSS already forces content visible)
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  const nav = document.getElementById("site-nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelectorAll(".site-nav .nav-link");
  const backToTop = document.getElementById("back-to-top");
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  // Mark icon elements as decorative for screen readers
  document.querySelectorAll("i").forEach((icon) => {
    if (!icon.hasAttribute("aria-hidden")) {
      icon.setAttribute("aria-hidden", "true");
    }
  });

  const mobileNav = window.matchMedia("(max-width: 1024px)");
  const setNavOpen = (open, returnFocus = false) => {
    if (!nav || !navToggle) return;
    const expanded = mobileNav.matches && open;
    nav.classList.toggle("is-open", expanded);
    nav.inert = mobileNav.matches && !expanded;
    navToggle.setAttribute("aria-expanded", String(expanded));
    navToggle.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
    const icon = navToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !expanded);
      icon.classList.toggle("fa-times", expanded);
    }
    if (returnFocus && mobileNav.matches) navToggle.focus({ preventScroll: true });
  };

  if (nav && navToggle) {
    setNavOpen(false);

    navToggle.addEventListener("click", (event) => {
      const open = !nav.classList.contains("is-open");
      setNavOpen(open);
      if (open && event.detail === 0) navLinks[0]?.focus({ preventScroll: true });
    });

    document.addEventListener("pointerdown", (event) => {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        setNavOpen(false);
      }
    });

    document.addEventListener("focusin", (event) => {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        setNavOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setNavOpen(false, true);
      }
    });

    const dismissOnScroll = () => {
      if (nav.classList.contains("is-open")) {
        setNavOpen(false, nav.contains(document.activeElement));
      }
    };
    window.addEventListener("scroll", dismissOnScroll, { passive: true });
    window.addEventListener("wheel", dismissOnScroll, { passive: true });
    window.addEventListener("touchmove", dismissOnScroll, { passive: true });
    mobileNav.addEventListener("change", () => {
      setNavOpen(false, nav.contains(document.activeElement));
    });
  }

  // Smooth scrolling for nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const rect = target.getBoundingClientRect();
      const offset = rect.top + window.scrollY - headerHeight - 12;

      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });

      // Close the dropdown and keep keyboard focus on the selected content.
      setNavOpen(false);
      if (event.detail === 0) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
      
      // Temporarily pause the active nav intersection observer until scroll completes
      isProgrammaticScroll = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 800);
    });
  });

  // Scroll-based header + nav link state + back-to-top button
  let isScrolling = false;
  let isProgrammaticScroll = false;
  let scrollTimeout;
  
  const handleScroll = () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;

        // Header shadow state
        if (header) {
          if (scrollY > 10) {
            header.classList.add("site-header--scrolled");
          } else {
            header.classList.remove("site-header--scrolled");
          }
        }

        // Back-to-top visibility
        if (backToTop) {
          if (scrollY > 260) {
            backToTop.classList.add("is-visible");
          } else {
            backToTop.classList.remove("is-visible");
          }
        }

        // Active nav link
        if (!isProgrammaticScroll) {
          let activeId = "";
          const headerHeight = header ? header.offsetHeight : 0;

          sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const top = rect.top + window.scrollY - headerHeight - 40;
            const bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
              activeId = section.id;
            }
          });

          // Ensure the last section is highlighted when scrolling reaches the bottom
          if (window.innerHeight + Math.round(scrollY) >= document.body.offsetHeight - 10) {
            if (sections.length > 0) {
              activeId = sections[sections.length - 1].id;
            }
          }

          if (activeId) {
            navLinks.forEach((link) => {
              const href = link.getAttribute("href");
              if (href === `#${activeId}`) {
                link.classList.add("is-active");
              } else {
                link.classList.remove("is-active");
              }
            });
          }
        }
        
        isScrolling = false;
      });
      isScrolling = true;
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Back-to-top behavior
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Resume link loading indicator
  const resumeLink = document.getElementById("resume-link");
  if (resumeLink) {
    const originalText = resumeLink.innerHTML;

    resumeLink.addEventListener("click", (e) => {
      // Allow middle-click / ctrl/cmd/shift/alt modified clicks to open in new tab/window
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // We do not use e.preventDefault() so that the browser handles opening the tab natively (respecting target="_blank")
      // This helps avoid popup blockers while still allowing us to show the loading indicator in the original tab.

      if (resumeLink.classList.contains("btn-loading")) return;

      resumeLink.classList.add("btn-loading");
      resumeLink.innerHTML = 'Opening <i class="fas fa-spinner fa-spin spinner"></i>';

      // Restore button state after a delay (if the user returns to this tab)
      setTimeout(() => {
        resumeLink.innerHTML = originalText;
        resumeLink.classList.remove("btn-loading");
      }, 2000);
    });

    // Reset button state if the page is loaded from bfcache (when user clicks Back button from same tab)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted || (window.performance && window.performance.navigation && window.performance.navigation.type === 2)) {
        resumeLink.innerHTML = originalText;
        resumeLink.classList.remove("btn-loading");
      }
    });
  }
});
