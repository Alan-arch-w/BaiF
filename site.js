import * as base from "./site-base.js";

export const {
  applyDocumentPreferences,
  applyTranslations,
  escapeHtml,
  formatYear,
  getCurrentLanguage,
  getCurrentTheme,
  getPreviewVersion,
  getQueryParam,
  getLocalizedValue,
  isPreviewMode,
  loadJson,
  setLanguage,
  setTheme,
  setupGlobalControls,
  setupSpatialCursor,
  syncPreviewLinks,
  t,
  withPreviewParams,
} = base;

const TAG_LABELS = {
  "AI Agent": { labelZh: "AI 智能体" },
  "Talent Policy": { labelZh: "人才政策" },
  "Rapid Prototype": { labelZh: "快速原型" },
  AI: { labelZh: "AI" },
  Dashboard: { labelZh: "仪表盘" },
  "Customer Service": { labelZh: "客服运营" },
  "Vibe Coding": { labelZh: "Vibe Coding" },
  "AI Creativity": { labelZh: "AI 创意" },
  "Interactive Prototype": { labelZh: "交互原型" },
  Hackathon: { labelZh: "黑客松" },
  "Data-driven Design": { labelZh: "数据驱动设计" },
  "Generative Design": { labelZh: "生成式设计" },
  "Urban Morphology": { labelZh: "城市形态" },
  GlobalMapper: { labelZh: "GlobalMapper" },
  "Graph Neural Network": { labelZh: "图神经网络" },
};

export function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return tags.map((tag) => {
    const raw = typeof tag === "object" ? tag : { label: tag, ...(TAG_LABELS[tag] || {}) };
    const value = base.getLocalizedValue(raw, "label");
    return `<span class="project-tag text-[10px] uppercase tracking-widest text-zinc-500 border border-white/10 px-2 py-1 rounded-full">${base.escapeHtml(value)}</span>`;
  }).join("");
}
