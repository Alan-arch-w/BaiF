const STORAGE_KEYS = {
  theme: "site-theme",
  language: "site-language",
};

const DEFAULTS = {
  theme: "dark",
  language: "en",
};

const COMMON_TRANSLATIONS = {
  "brand.name": { en: "Alan Wang", zh: "Alan Wang" },
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

export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const payload = await res.json();
  if (payload && typeof payload === "object" && Array.isArray(payload.value)) {
    return payload.value;
  }
  return payload;
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

function renderControlLabel(target, key) {
  if (!target) return;
  target.textContent = t(key);
}

function updateControlsState(root) {
  if (!root) return;
  const lang = getCurrentLanguage();
  const theme = getCurrentTheme();

  renderControlLabel(root.querySelector("[data-role='lang-label']"), "controls.language");
  renderControlLabel(root.querySelector("[data-role='theme-label']"), "controls.theme");
  renderControlLabel(root.querySelector("[data-role='lang-en']"), "controls.english");
  renderControlLabel(root.querySelector("[data-role='lang-zh']"), "controls.chinese");
  renderControlLabel(root.querySelector("[data-role='theme-dark']"), "controls.dark");
  renderControlLabel(root.querySelector("[data-role='theme-light']"), "controls.light");

  root.querySelectorAll("[data-lang-option]").forEach((btn) => {
    const active = btn.dataset.langOption === lang;
    btn.dataset.active = active ? "true" : "false";
  });

  root.querySelectorAll("[data-theme-option]").forEach((btn) => {
    const active = btn.dataset.themeOption === theme;
    btn.dataset.active = active ? "true" : "false";
  });
}

export function setupGlobalControls() {
  let root = document.getElementById("site-controls");
  if (!root) {
    root = document.createElement("div");
    root.id = "site-controls";
    root.className = "site-controls";
    root.innerHTML = `
      <div class="site-control-block">
        <div class="site-control-label" data-role="lang-label"></div>
        <div class="site-segmented">
          <button type="button" class="site-segment" data-role="lang-en" data-lang-option="en"></button>
          <button type="button" class="site-segment" data-role="lang-zh" data-lang-option="zh"></button>
        </div>
      </div>
      <div class="site-control-block">
        <div class="site-control-label" data-role="theme-label"></div>
        <div class="site-segmented">
          <button type="button" class="site-segment" data-role="theme-dark" data-theme-option="dark"></button>
          <button type="button" class="site-segment" data-role="theme-light" data-theme-option="light"></button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    root.querySelectorAll("[data-lang-option]").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.langOption));
    });

    root.querySelectorAll("[data-theme-option]").forEach((btn) => {
      btn.addEventListener("click", () => setTheme(btn.dataset.themeOption));
    });

    window.addEventListener("site:language-change", () => updateControlsState(root));
    window.addEventListener("site:theme-change", () => updateControlsState(root));
  }

  updateControlsState(root);
  return root;
}

applyDocumentPreferences();

