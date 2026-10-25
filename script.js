const Portfolio = (() => {
  const CONFIG = {
    HEADER_SCROLL_THRESHOLD: 10,
    BACK_TO_TOP_THRESHOLD: 260,
    SMOOTH_SCROLL_DURATION: 800,
    HEADER_OFFSET: 12,
    SECTION_OFFSET: 40,
  };

  const DOM = {
    init() {
      this.header = document.getElementById("site-header");
      this.nav = document.getElementById("site-nav");
      this.navToggle = document.getElementById("nav-toggle");
      this.navLinks = document.querySelectorAll(".site-nav .nav-link");
      this.backToTop = document.getElementById("back-to-top");
      this.sections = Array.from(this.navLinks, (link) =>
        document.querySelector(link.getAttribute("href"))
      ).filter(Boolean);
      this.resumeLink = document.getElementById("resume-link");
    },
  };

  const state = {
    isProgrammaticScroll: false,
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
      this.toggle(false);
      this.setupToggleButton();
      this.setupDismissal();
      this.mobileNav.addEventListener("change", () => this.toggle(false));
    },

    toggle(open = !state.mobileNavOpen, { returnFocus = false } = {}) {
      const isMobile = this.mobileNav.matches;
      const expanded = isMobile && open;
      state.mobileNavOpen = expanded;

      DOM.nav.classList.toggle("is-open", expanded);
      DOM.nav.inert = isMobile && !expanded;
      DOM.navToggle.setAttribute("aria-expanded", String(expanded));
      DOM.navToggle.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");

      const icon = DOM.navToggle.querySelector("i");
      icon?.classList.toggle("fa-bars", !expanded);
      icon?.classList.toggle("fa-times", expanded);

      if (returnFocus && isMobile) DOM.navToggle.focus({ preventScroll: true });
    },

    setupToggleButton() {
      DOM.navToggle.addEventListener("click", (e) => {
        this.toggle();
        // Keyboard activation (detail === 0) moves focus into the opened menu.
        if (state.mobileNavOpen && e.detail === 0) DOM.navLinks[0]?.focus({ preventScroll: true });
      });
    },

    setupDismissal() {
      const isInsideNav = (target) => DOM.nav.contains(target) || DOM.navToggle.contains(target);
      const closeIfOutside = (e) => state.mobileNavOpen && !isInsideNav(e.target) && this.toggle(false);
      const closeOnScroll = () =>
        state.mobileNavOpen && this.toggle(false, { returnFocus: DOM.nav.contains(document.activeElement) });

      document.addEventListener("pointerdown", closeIfOutside);
      document.addEventListener("focusin", closeIfOutside);
      ["scroll", "wheel", "touchmove"].forEach((type) =>
        window.addEventListener(type, closeOnScroll, { passive: true })
      );
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && state.mobileNavOpen) this.toggle(false, { returnFocus: true });
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
      this.scrollToSection(target, e.detail === 0);
      this.updateActiveLink(targetId);
      MobileNavigation.toggle(false);
    },

    scrollToSection(target, fromKeyboard) {
      const headerHeight = DOM.header?.offsetHeight ?? 0;
      const { top } = target.getBoundingClientRect();
      const offset = top + window.scrollY - headerHeight - CONFIG.HEADER_OFFSET;

      window.scrollTo({ top: offset, behavior: "smooth" });

      if (fromKeyboard) {
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
        link.classList.toggle("is-active", link.getAttribute("href") === targetId);
      });
    },

    updateActiveOnScroll() {
      if (state.isProgrammaticScroll || !DOM.sections.length) return;

      const scrollY = window.scrollY;
      const probe = (DOM.header?.offsetHeight ?? 0) + CONFIG.SECTION_OFFSET;
      const atBottom =
        window.innerHeight + Math.round(scrollY) >= document.documentElement.scrollHeight - 20;

      let active = DOM.sections[0];
      for (const section of DOM.sections) {
        if (section.getBoundingClientRect().top <= probe) active = section;
      }
      if (atBottom) active = DOM.sections[DOM.sections.length - 1];

      this.updateActiveLink(`#${active.id}`);
    },
  };

  const ScrollManager = {
    init() {
      window.addEventListener("scroll", () => this.handleScroll(), { passive: true });
      this.handleScroll();
    },

    handleScroll() {
      const scrollY = window.scrollY;
      this.updateHeaderShadow(scrollY);
      this.updateBackToTopButton(scrollY);
      Navigation.updateActiveOnScroll();
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
      DOM.resumeLink.innerHTML = 'Opening <i class="fas fa-spinner fa-spin"></i>';

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
