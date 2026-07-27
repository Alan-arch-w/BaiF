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
  return res.json();
}

export function formatYear(year) {
  if (!year) return "";
  return String(year);
}

export function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return tags
    .map(
      (t) =>
        `<span class="text-[10px] uppercase tracking-widest text-zinc-500 border border-white/10 px-2 py-1 rounded-full">${escapeHtml(
          t
        )}</span>`
    )
    .join("");
}

