// Advanced modular portfolio app
const Portfolio = (() => {
  const CONFIG = {
    HEADER_SCROLL_THRESHOLD: 10,
    BACK_TO_TOP_THRESHOLD: 260,
    SMOOTH_SCROLL_DURATION: 800,
    HEADER_OFFSET: 12,
    SECTION_OFFSET: 40,
  };

  const DOM = {
    header: null,
    nav: null,
    navToggle: null,
    navLinks: null,
    backToTop: null,
    sections: [],
    resumeLink: null,

    init() {
      this.header = document.getElementById("site-header");
      this.nav = document.getElementById("site-nav");
      this.navToggle = document.getElementById("nav-toggle");
      this.navLinks = document.querySelectorAll(".site-nav .nav-link");
      this.backToTop = document.getElementById("back-to-top");
      this.sections = Array.from(document.querySelectorAll("main section[id]"));
      this.resumeLink = document.getElementById("resume-link");
    },
  };

  const state = {
    isProgrammaticScroll: false,
    isScrolling: false,
    scrollTimeout: null,
    mobileNavOpen: false,
  };

  const AccessibilityManager = {
    init() {
      this.markIconsAsDecorative();
    },

    markIconsAsDecorative() {
      document.querySelectorAll("i").forEach((icon) => {
        if (!icon.hasAttribute("aria-hidden")) icon.setAttribute("aria-hidden", "true");
      });
    },
  };

  const MobileNavigation = {
    mobileNav: window.matchMedia("(max-width: 1024px)"),

    init() {
      if (!DOM.nav || !DOM.navToggle) return;
      this.setupToggleButton();
      this.setupOutsideClickDismissal();
      this.setupMediaQueryListener();
    },

    toggle(open = !state.mobileNavOpen) {
      state.mobileNavOpen = open;
      const shouldExpand = this.mobileNav.matches && open;

      DOM.nav.classList.toggle("is-open", shouldExpand);
      DOM.nav.inert = this.mobileNav.matches && !shouldExpand;
      DOM.navToggle.setAttribute("aria-expanded", String(shouldExpand));
      DOM.navToggle.setAttribute(
        "aria-label",
        shouldExpand ? "Close navigation" : "Open navigation"
      );

      const icon = DOM.navToggle.querySelector("i");
      icon?.classList.toggle("fa-bars", !shouldExpand);
      icon?.classList.toggle("fa-times", shouldExpand);

      if (shouldExpand && !state.mobileNavOpen) DOM.navLinks[0]?.focus({ preventScroll: true });
    },

    setupToggleButton() {
      DOM.navToggle.addEventListener("click", (e) => {
        this.toggle();
        if (e.detail === 0) DOM.navLinks[0]?.focus({ preventScroll: true });
      });
    },

    setupOutsideClickDismissal() {
      const isNavClick = (target) => DOM.nav.contains(target) || DOM.navToggle.contains(target);

      const handlers = [
        ["pointerdown", (e) => !isNavClick(e.target) && this.toggle(false)],
        ["focusin", (e) => !isNavClick(e.target) && this.toggle(false)],
        ["scroll", () => state.mobileNavOpen && this.toggle(false), { passive: true }],
        ["wheel", () => state.mobileNavOpen && this.toggle(false), { passive: true }],
        ["touchmove", () => state.mobileNavOpen && this.toggle(false), { passive: true }],
      ];

      handlers.forEach(([event, handler, opts]) => {
        document.addEventListener(event, handler, opts || false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && state.mobileNavOpen) this.toggle(false);
      });
    },

    setupMediaQueryListener() {
      this.mobileNav.addEventListener("change", () => {
        state.mobileNavOpen && this.toggle(false);
      });
    },
  };

  const Navigation = {
    init() {
      DOM.navLinks.forEach((link) => link.addEventListener("click", (e) => this.handleLinkClick(e)));
    },

    handleLinkClick(e) {
      const targetId = e.currentTarget.getAttribute("href");
      if (!targetId?.startsWith("#")) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      this.scrollToSection(target, targetId);
      this.updateActiveLink(targetId);
      MobileNavigation.toggle(false);
    },

    scrollToSection(target, targetId) {
      const headerHeight = DOM.header?.offsetHeight ?? 0;
      const { top } = target.getBoundingClientRect();
      const offset = top + window.scrollY - headerHeight - CONFIG.HEADER_OFFSET;

      window.scrollTo({ top: offset, behavior: "smooth" });

      if (event?.detail === 0) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }

      state.isProgrammaticScroll = true;
      clearTimeout(state.scrollTimeout);
      state.scrollTimeout = setTimeout(() => {
        state.isProgrammaticScroll = false;
      }, CONFIG.SMOOTH_SCROLL_DURATION);
    },

    updateActiveLink(targetId) {
      DOM.navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("is-active", href === targetId);
      });
    },

    updateActiveOnScroll() {
      if (state.isProgrammaticScroll) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const headerHeight = DOM.header?.offsetHeight ?? 0;
      let activeId = "";

      for (const section of DOM.sections) {
        const sectionTop = section.offsetTop - headerHeight;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          activeId = section.id;
        }
      }

      if (window.innerHeight + Math.round(scrollY) >= document.body.offsetHeight - 20) {
        activeId = DOM.sections[DOM.sections.length - 1]?.id || "";
      }

      if (activeId) {
        DOM.navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
        });
      }
    },
  };

  const ScrollManager = {
    init() {
      window.addEventListener("scroll", () => this.handleScroll(), { passive: true });
      this.handleScroll();
    },

    handleScroll() {
      if (state.isScrolling) return;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;

        this.updateHeaderShadow(scrollY);
        this.updateBackToTopButton(scrollY);
        Navigation.updateActiveOnScroll();

        state.isScrolling = false;
      });

      state.isScrolling = true;
    },

    updateHeaderShadow(scrollY) {
      DOM.header?.classList.toggle("site-header--scrolled", scrollY > CONFIG.HEADER_SCROLL_THRESHOLD);
    },

    updateBackToTopButton(scrollY) {
      DOM.backToTop?.classList.toggle("is-visible", scrollY > CONFIG.BACK_TO_TOP_THRESHOLD);
    },
  };

  const ResumeButton = {
    init() {
      if (!DOM.resumeLink) return;
      this.originalHTML = DOM.resumeLink.innerHTML;
      DOM.resumeLink.addEventListener("click", (e) => this.handleClick(e));
      window.addEventListener("pageshow", () => this.resetState());
    },

    handleClick(e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (DOM.resumeLink.classList.contains("btn-loading")) return;

      DOM.resumeLink.classList.add("btn-loading");
      DOM.resumeLink.innerHTML = 'Opening <i class="fas fa-spinner fa-spin spinner"></i>';

      setTimeout(() => this.resetState(), 2000);
    },

    resetState() {
      DOM.resumeLink.innerHTML = this.originalHTML;
      DOM.resumeLink.classList.remove("btn-loading");
    },
  };

  const BackToTop = {
    init() {
      DOM.backToTop?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
  };

  const AnimationManager = {
    init() {
      if (!window.AOS) return;
      window.AOS.init({
        once: true,
        duration: 750,
        easing: "ease-out-cubic",
        disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    },
  };

  return {
    init() {
      DOM.init();
      AccessibilityManager.init();
      MobileNavigation.init();
      Navigation.init();
      ScrollManager.init();
      BackToTop.init();
      ResumeButton.init();
      AnimationManager.init();
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => Portfolio.init());
window.addEventListener("load", () => AnimationManager.init?.());
