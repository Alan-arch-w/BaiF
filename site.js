const STORAGE_KEYS = {
  theme: "site-theme",
  language: "site-language",
};

const DEFAULTS = {
  theme: "dark",
  language: "en",
};

const PREVIEW_QUERY_KEYS = {
  preview: "preview",
  version: "version",
};

const COMMON_TRANSLATIONS = {
  "brand.name": { en: "ALAN WANG", zh: "ALAN WANG" },
  "nav.projects": { en: "Projects", zh: "项目" },
  "nav.portfolio": { en: "Portfolio", zh: "作品集" },
  "nav.articles": { en: "Articles", zh: "文章" },
  "nav.about": { en: "About", zh: "关于" },
  "nav.contact": { en: "Contact", zh: "联系" },
  "controls.language": { en: "Language", zh: "语言" },
  "controls.theme": { en: "Theme", zh: "主题" },
  "controls.english": { en: "EN", zh: "英文" },
  "controls.chinese": { en: "中文", zh: "中文" },
  "controls.dark": { en: "Dark", zh: "暗色" },
  "controls.light": { en: "Light", zh: "亮色" },
  "controls.toggleLanguage": { en: "Toggle language", zh: "切换语言" },
  "controls.toggleTheme": { en: "Toggle theme", zh: "切换主题" },
  "common.open": { en: "Open", zh: "打开" },
  "common.failedProjects": { en: "Failed to load projects.", zh: "项目加载失败。" },
  "common.failedPosts": { en: "Failed to load posts.", zh: "文章加载失败。" },
  "common.failedPortfolio": { en: "Failed to load portfolio.", zh: "作品集加载失败。" },
  "common.projectNotFound": { en: "Project Not Found", zh: "未找到该项目" },
  "common.postNotFound": { en: "Post Not Found", zh: "未找到该文章" },
  "common.portfolioNotFound": { en: "Portfolio Item Not Found", zh: "未找到该作品条目" },
  "common.invalidProjectId": { en: "Missing or invalid project id.", zh: "缺少项目 ID 或项目不存在。" },
  "common.invalidPostSlug": { en: "Missing or invalid slug.", zh: "缺少 slug 或文章不存在。" },
  "common.invalidPortfolioId": { en: "Missing or invalid id.", zh: "缺少作品 ID 或条目不存在。" },
  "common.noPdf": { en: "No PDF attached.", zh: "当前没有附加 PDF。" },
  "common.downloadPdf": { en: "Download PDF", zh: "下载 PDF" },
  "common.link": { en: "Link", zh: "链接" },
};

let versionDataPromise = null;
let spatialCursorInitialized = false;

function safeGetStorage(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function getCurrentLanguage() {
  const lang = safeGetStorage(STORAGE_KEYS.language, DEFAULTS.language);
  return lang === "zh" ? "zh" : "en";
}

export function getCurrentTheme() {
  const theme = safeGetStorage(STORAGE_KEYS.theme, DEFAULTS.theme);
  return theme === "light" ? "light" : "dark";
}

export function applyDocumentPreferences() {
  const lang = getCurrentLanguage();
  const theme = getCurrentTheme();
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.theme = theme;
}

export function setLanguage(lang) {
  const next = lang === "zh" ? "zh" : "en";
  safeSetStorage(STORAGE_KEYS.language, next);
  applyDocumentPreferences();
  window.dispatchEvent(new CustomEvent("site:language-change", { detail: { lang: next } }));
}

export function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  safeSetStorage(STORAGE_KEYS.theme, next);
  applyDocumentPreferences();
  window.dispatchEvent(new CustomEvent("site:theme-change", { detail: { theme: next } }));
}

export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(name);
  return value && value.trim() ? value.trim() : null;
}

export function getPreviewVersion() {
  return getQueryParam(PREVIEW_QUERY_KEYS.version);
}

export function isPreviewMode() {
  if (getPreviewVersion()) return true;
  const preview = getQueryParam(PREVIEW_QUERY_KEYS.preview);
  if (!preview) return false;
  return ["1", "true", "yes", "preview", "admin"].includes(preview.toLowerCase());
}

export function withPreviewParams(url) {
  const value = String(url || "");
  const hashIndex = value.indexOf("#");
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(search);

  const version = getPreviewVersion();
  if (version) {
    params.set(PREVIEW_QUERY_KEYS.version, version);
  }

  if (isPreviewMode()) {
    params.set(PREVIEW_QUERY_KEYS.preview, "1");
  }

  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}

export function syncPreviewLinks(root = document) {
  if (!isPreviewMode()) return;
  root.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!/\.html(?:$|[?#])/i.test(href)) return;
    link.setAttribute("href", withPreviewParams(href));
  });
}

async function ensureVersionDataLoaded() {
  const version = getPreviewVersion();
  if (!version) return null;
  if (window.__SITE_VERSION_DATA__) return window.__SITE_VERSION_DATA__;
  if (versionDataPromise) return versionDataPromise;

  versionDataPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-site-version-loader='true']");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.__SITE_VERSION_DATA__ || null), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load version ${version}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `./data/versions/${encodeURIComponent(version)}.js`;
    script.async = true;
    script.dataset.siteVersionLoader = "true";
    script.onload = () => resolve(window.__SITE_VERSION_DATA__ || null);
    script.onerror = () => reject(new Error(`Failed to load version ${version}`));
    document.head.appendChild(script);
  });

  return versionDataPromise;
}

export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function loadJson(path) {
  const localKey = String(path)
    .replace(/^\.\/data\//, "")
    .replace(/\.json$/, "");

  if (getPreviewVersion()) {
    const versionPayload = await ensureVersionDataLoaded();
    if (versionPayload && versionPayload[localKey] !== undefined) {
      return versionPayload[localKey];
    }
    throw new Error(`Preview version data missing for ${localKey}`);
  }

  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const payload = await res.json();
    if (payload && typeof payload === "object" && Array.isArray(payload.value)) {
      return payload.value;
    }
    return payload;
  } catch (error) {
    const localPayload = window.__SITE_LOCAL_DATA__?.[localKey];
    if (localPayload !== undefined) {
      return localPayload;
    }
    throw error;
  }
}

export function formatYear(year) {
  if (!year) return "";
  return String(year);
}

export function t(key, overrides = {}) {
  const lang = getCurrentLanguage();
  const dict = { ...COMMON_TRANSLATIONS, ...overrides };
  const value = dict[key];
  if (!value) return key;
  if (typeof value === "string") return value;
  return value[lang] || value.en || key;
}

export function getLocalizedValue(item, key) {
  if (!item) return "";
  if (getCurrentLanguage() === "zh" && item[`${key}Zh`]) {
    return item[`${key}Zh`];
  }
  return item[key] ?? "";
}

export function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return tags
    .map((tag) => {
      const value = typeof tag === "object" ? getLocalizedValue(tag, "label") : tag;
      return `<span class="text-[10px] uppercase tracking-widest text-zinc-500 border border-white/10 px-2 py-1 rounded-full">${escapeHtml(
        value
      )}</span>`;
    })
    .join("");
}

export function applyTranslations(overrides = {}) {
  const titleEl = document.querySelector("title[data-title-key]");
  if (titleEl) {
    const nextTitle = t(titleEl.dataset.titleKey, overrides);
    if (nextTitle) document.title = nextTitle;
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n, overrides);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml, overrides);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder, overrides));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel, overrides));
  });
}

function updateControlsState(root) {
  if (!root) return;
  const lang = getCurrentLanguage();
  const theme = getCurrentTheme();
  const langButton = root.querySelector("[data-role='toggle-language']");
  const themeButton = root.querySelector("[data-role='toggle-theme']");

  if (langButton) {
    langButton.dataset.state = lang;
    langButton.setAttribute("aria-label", t("controls.toggleLanguage"));
    langButton.setAttribute("title", t("controls.toggleLanguage"));
  }

  if (themeButton) {
    themeButton.dataset.state = theme;
    themeButton.setAttribute("aria-label", t("controls.toggleTheme"));
    themeButton.setAttribute("title", t("controls.toggleTheme"));
    themeButton.innerHTML = theme === "light"
      ? `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.75V2m0 20v-1.75M4.93 4.93 3.69 3.69m16.62 16.62-1.24-1.24M20.25 12H22M2 12h1.75m1.18 7.07-1.24 1.24m16.62-16.62-1.24 1.24M12 17.25a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z" />
        </svg>
      `
      : `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3c-.02.25-.03.5-.03.75a8.25 8.25 0 0 0 8.25 8.25c.25 0 .5-.01.75-.03Z" />
        </svg>
      `;
  }
}

export function setupGlobalControls() {
  setupSpatialCursor();
  let root = document.getElementById("site-controls");
  if (!root) {
    root = document.createElement("div");
    root.id = "site-controls";
    root.className = "site-controls";
    root.innerHTML = `
      <button type="button" class="site-control-button" data-role="toggle-language">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h9M8.5 5c0 7-3 11-6 13m8-9h7m-3.5 0c0 4.5 2.2 8 5.5 10m-11-2 4-10 4 10m-6.8-4h5.6" />
        </svg>
      </button>
      <button type="button" class="site-control-button" data-role="toggle-theme"></button>
    `;
    document.body.appendChild(root);

    root.querySelector("[data-role='toggle-language']")?.addEventListener("click", () => {
      setLanguage(getCurrentLanguage() === "zh" ? "en" : "zh");
    });

    root.querySelector("[data-role='toggle-theme']")?.addEventListener("click", () => {
      setTheme(getCurrentTheme() === "light" ? "dark" : "light");
    });

    window.addEventListener("site:language-change", () => updateControlsState(root));
    window.addEventListener("site:theme-change", () => updateControlsState(root));
  }

  updateControlsState(root);
  syncPreviewLinks(document);
  return root;
}

export function setupSpatialCursor() {
  if (spatialCursorInitialized) return document.querySelector(".spatial-cursor");
  const existingCursor = document.querySelector(".spatial-cursor");
  if (existingCursor) {
    spatialCursorInitialized = true;
    document.body.classList.add("custom-cursor-active");
    return existingCursor;
  }
  if (!window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches) return null;

  spatialCursorInitialized = true;
  const reduceCursorMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cursor = document.createElement("div");
  cursor.className = "spatial-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = `<span class="spatial-cursor__corners"></span><span class="spatial-cursor__dot"></span><span class="spatial-cursor__label">OPEN</span>`;
  document.body.appendChild(cursor);
  document.body.classList.add("custom-cursor-active");

  const label = cursor.querySelector(".spatial-cursor__label");
  let currentX = window.innerWidth * 0.5;
  let currentY = window.innerHeight * 0.5;
  let targetX = currentX;
  let targetY = currentY;
  let frame = 0;

  const syncInteractiveState = (target) => {
    const interactive = target?.closest?.("a, button, [role='button'], [data-cursor]");
    cursor.classList.toggle("is-interactive", Boolean(interactive));
    cursor.classList.toggle("is-face", Boolean(interactive?.classList.contains("space-face")));
    if (interactive) label.textContent = interactive.dataset.cursor || (interactive.matches("button") ? "SET" : "OPEN");
  };

  const render = () => {
    currentX += (targetX - currentX) * 0.28;
    currentY += (targetY - currentY) * 0.28;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      frame = requestAnimationFrame(render);
    } else {
      frame = 0;
    }
  };

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    syncInteractiveState(event.target);
    cursor.style.opacity = "1";
    if (reduceCursorMotion) {
      currentX = targetX;
      currentY = targetY;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    } else if (!frame) {
      frame = requestAnimationFrame(render);
    }
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });

  document.addEventListener("pointerover", (event) => {
    syncInteractiveState(event.target);
  });

  document.addEventListener("pointerout", (event) => {
    if (!event.target.closest("a, button, [role='button'], [data-cursor]")) return;
    if (event.relatedTarget?.closest?.("a, button, [role='button'], [data-cursor]")) return;
    syncInteractiveState(event.relatedTarget);
  });

  return cursor;
}

applyDocumentPreferences();
document.documentElement.dataset.siteBuild = "20260812-1";
