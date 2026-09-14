(() => {
  const sections = { work: "projects", projects: "projects", about: "about", contact: "contact" };
  const showHashSection = () => {
    const key = (window.location.hash || "").slice(1).toLowerCase();
    const name = sections[key];
    if (!name) return;
    const panels = [...document.querySelectorAll("[data-story-panel]")];
    const panel = panels.find((item) => item.dataset.storyPanel === name);
    if (!panel) return;
    document.body.classList.add("story-ready", "story-paged", "story-active");
    panels.forEach((item) => {
      const active = item === panel;
      item.classList.toggle("is-active", active);
      item.style.opacity = active ? "1" : "0";
      item.style.visibility = active ? "visible" : "hidden";
      item.style.transform = active ? "none" : "translate(24px, 0)";
    });
    document.querySelector(".spatial-hero__copy")?.style.setProperty("opacity", "0");
    document.querySelector(".spatial-hero__explore")?.style.setProperty("opacity", "0");
    document.querySelectorAll("[data-story-nav]").forEach((button) => {
      const active = button.dataset.storyNav === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    document.querySelectorAll(".space-face").forEach((face) => face.classList.remove("is-active-face"));
    const face = document.querySelector(`.space-face--${name === "projects" ? "front" : name === "photography" ? "back" : name === "articles" ? "right" : name === "about" ? "top" : "bottom"}`);
    face?.classList.add("is-active-face");
  };

  window.addEventListener("hashchange", showHashSection);
  window.addEventListener("load", () => window.setTimeout(showHashSection, 2200), { once: true });
  window.setTimeout(showHashSection, 2200);
})();
