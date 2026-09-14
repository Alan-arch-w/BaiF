import {
  applyTranslations,
  escapeHtml,
  getCurrentLanguage,
  getLocalizedValue,
  loadJson,
  setupGlobalControls,
  syncPreviewLinks,
  t,
  withPreviewParams,
} from "./site.js?v=20260914-1";

const translations = {
  "home.story.projects": { en: "Selected work, systems and experiments shaped through spatial thinking.", zh: "以空间思维展开的项目、系统与实验。" },
  "home.story.photography": { en: "Fragments of place, light and time collected through observation.", zh: "在观察中收集地点、光线与时间的片段。" },
  "home.story.articles": { en: "Notes on making, seeing and the ideas that connect them.", zh: "关于创造、观看，以及连接两者的思考。" },
  "page.home.title": { en: "BaiF'S SPACE", zh: "白方的个人主页" },
  "home.hero.title": { en: "Life carves <br /><span class='text-zinc-500'>its</span> path.", zh: "人生自会 <br /><span class='text-zinc-500'>刻出</span>它的路径。" },
  "home.hero.subtitle": { en: "the answer to life is not elsewhere.", zh: "人生的答案，并不在别处。" },
  "home.hero.explore": { en: "Explore selected work", zh: "探索作品" },
  "home.cube.photography": { en: "Photography", zh: "摄影" },
  "home.featured.viewAll": { en: "View all", zh: "查看全部" },
  "home.about.body": { en: "A creator working across product, AI, code and visual expression, exploring spatial thinking in digital products.", zh: "在产品、AI、代码与视觉表达之间工作，探索空间思维如何进入数字产品。" },
  "home.about.keyword1": { en: "Product", zh: "产品" },
  "home.about.keyword2": { en: "Code", zh: "代码" },
  "home.about.keyword3": { en: "Visual", zh: "视觉" },
  "home.about.keyword4": { en: "Spatial thinking", zh: "空间思维" },
  "home.about.readProfile": { en: "Read profile", zh: "查看完整介绍" },
};

const elements = {
  projects: document.getElementById("featured-projects"),
  portfolio: document.getElementById("portfolio-preview"),
  articles: document.getElementById("articles-preview"),
  about: document.getElementById("about-body"),
  contact: document.getElementById("contact-social-links"),
};

const data = { projects: [], portfolio: [], posts: [], profile: null };

function storyRow({ href, title, meta = "", summary = "", cursor = "OPEN" }) {
  return `
    <a href="${withPreviewParams(href)}" class="spatial-story__row" data-cursor="${cursor}">
      <span class="spatial-story__row-main">
        <strong>${escapeHtml(title)}</strong>
        ${summary ? `<span>${escapeHtml(summary)}</span>` : ""}
      </span>
      <span class="spatial-story__row-meta">${escapeHtml(meta)}</span>
    </a>
  `;
}

function renderProjects() {
  const featured = data.projects.filter((project) => project?.featured);
  const projects = featured.length ? featured : data.projects;
  elements.projects.innerHTML = projects.map((project) => storyRow({
    href: `./project.html?id=${encodeURIComponent(project.id)}`,
    title: getLocalizedValue(project, "title"),
    summary: getLocalizedValue(project, "summary"),
    meta: [getLocalizedValue(project, "category"), project.year].filter(Boolean).join(" · "),
    cursor: "VIEW",
  })).join("");
  syncPreviewLinks(elements.projects);
}

function renderPortfolio() {
  elements.portfolio.innerHTML = data.portfolio
    .filter((item) => item.tags?.includes("Photography"))
    .slice(0, 3)
    .map((item) => storyRow({
      href: `./portfolio-item.html?id=${encodeURIComponent(item.id)}`,
      title: getLocalizedValue(item, "title"),
      summary: getLocalizedValue(item, "summary"),
      meta: [item.tags?.[0], item.year].filter(Boolean).join(" · "),
      cursor: "VIEW",
    })).join("");
  syncPreviewLinks(elements.portfolio);
}

function renderArticles() {
  elements.articles.innerHTML = data.posts
    .filter((post) => post.status !== "draft")
    .slice(0, 3)
    .map((post) => storyRow({
      href: `./post.html?slug=${encodeURIComponent(post.slug)}`,
      title: getLocalizedValue(post, "title"),
      summary: getLocalizedValue(post, "summary"),
      meta: [post.tags?.[0], post.date].filter(Boolean).join(" · "),
      cursor: "READ",
    })).join("");
  syncPreviewLinks(elements.articles);
}

function renderProfile() {
  if (!data.profile) return;
  const bio = getCurrentLanguage() === "zh" && data.profile.homeBioZh
    ? data.profile.homeBioZh
    : data.profile.homeBio || data.profile.bio || "";
  if (bio) elements.about.textContent = bio;

  const links = data.profile.contact?.socialLinks;
  if (!Array.isArray(links) || !links.length) return;
  elements.contact.innerHTML = links.map((link) => {
    const type = escapeHtml(link.type || "link");
    const label = escapeHtml(getCurrentLanguage() === "zh" && link.labelZh ? link.labelZh : link.label || "Link");
    const meta = escapeHtml(getCurrentLanguage() === "zh" && link.metaZh ? link.metaZh : link.meta || "");
    const url = escapeHtml(link.url || "#");
    const platform = link.type === "xiaohongshu" ? (getCurrentLanguage() === "zh" ? "小红书" : "REDNOTE") : link.type === "github" ? "GitHub" : "Link";
    return `
      <a href="${url}" target="_blank" rel="noreferrer" class="contact-channel" data-contact-type="${type}" data-cursor="OPEN">
        <span class="contact-channel__platform">${platform}</span>
        <span class="contact-channel__identity"><strong>${label}</strong>${meta ? `<small>${meta}</small>` : ""}</span>
        <span class="contact-channel__arrow" aria-hidden="true">↗</span>
      </a>
    `;
  }).join("");
}

function render() {
  applyTranslations(translations);
  renderProjects();
  renderPortfolio();
  renderArticles();
  renderProfile();
}

async function loadContent() {
  const [projects, portfolio, posts, profile] = await Promise.allSettled([
    loadJson("./data/projects.json"),
    loadJson("./data/portfolio.json"),
    loadJson("./data/posts.json"),
    loadJson("./data/profile.json"),
  ]);
  data.projects = projects.status === "fulfilled" && Array.isArray(projects.value) ? projects.value : [];
  data.portfolio = portfolio.status === "fulfilled" && Array.isArray(portfolio.value) ? portfolio.value : [];
  data.posts = posts.status === "fulfilled" && Array.isArray(posts.value) ? posts.value : [];
  data.profile = profile.status === "fulfilled" ? profile.value : null;
  if (projects.status === "rejected") elements.projects.innerHTML = `<div class="text-zinc-500 text-sm">${t("common.failedProjects", translations)}</div>`;
  render();
}

setupGlobalControls();
applyTranslations(translations);
loadContent();
window.addEventListener("site:language-change", render);
