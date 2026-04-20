const topbar = document.querySelector("[data-topbar]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = navLinks
  .map((link) => {
    const id = link.getAttribute("href");
    return id ? document.querySelector(id) : null;
  })
  .filter(Boolean);
const yearNode = document.querySelector("#current-year");
const siteConfig = window.__SITE_CONFIG__ || {};

const loadExternalScript = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const initGoogleAnalytics = async (measurementId) => {
  const trimmedId = typeof measurementId === "string" ? measurementId.trim() : "";
  if (!trimmedId || window.gtag) return;

  await loadExternalScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(trimmedId)}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", trimmedId, {
    anonymize_ip: true,
    page_path: window.location.pathname + window.location.search
  });
};

const initClarity = (projectId) => {
  const trimmedId = typeof projectId === "string" ? projectId.trim() : "";
  if (!trimmedId || window.clarity) return;

  (function init(c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function clarityShim() {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = `https://www.clarity.ms/tag/${i}`;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", trimmedId);
};

const initAnalytics = async () => {
  try {
    await initGoogleAnalytics(siteConfig.gaMeasurementId);
  } catch (error) {
    console.error(error);
  }

  initClarity(siteConfig.clarityProjectId);
};

const closeNav = () => {
  if (!nav || !navToggle) return;
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
};

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 760) {
      closeNav();
    }
  });
});

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const handleScroll = () => {
  if (topbar) {
    topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  let activeId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 180 && rect.bottom >= 180) {
      activeId = `#${section.id}`;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === activeId);
  });
};

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeNav();
  }
});

handleScroll();
void initAnalytics();
