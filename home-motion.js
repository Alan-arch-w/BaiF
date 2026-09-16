(() => {
  "use strict";

  const focusStyles = document.createElement("link");
  focusStyles.rel = "stylesheet";
  focusStyles.href = "./home-focus.css?v=20260916-3";
  document.head.append(focusStyles);

  const gsap = window.gsap;
  const hero = document.querySelector("[data-home-hero]");
  if (!hero || !gsap) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const panels = gsap.utils.toArray("[data-story-panel]");
  const cube = document.querySelector(".spatial-cube");
  const viewport = document.querySelector(".cube-viewport");
  const copy = document.querySelector(".spatial-hero__copy");
  const explore = document.querySelector(".spatial-hero__explore");
  const idleLayer = document.querySelector(".cube-idle-spin");
  const tiltLayer = document.querySelector(".cube-tilt");
  // Each chapter ends with one face square to the camera. The cube is then
  // rotated 45deg in the screen plane and pushed beyond the right edge, so
  // only the left corner of that single face remains visible.
  const chapters = [
    { name: "projects", face: ".space-face--front", x: 0, y: 0, z: 0, label: "nav.projects" },
    { name: "photography", face: ".space-face--back", x: 0, y: 180, z: 0, label: "home.cube.photography" },
    { name: "articles", face: ".space-face--right", x: 0, y: -90, z: 0, label: "nav.articles" },
    { name: "about", face: ".space-face--top", x: -90, y: 0, z: 0, label: "nav.about" },
    { name: "contact", face: ".space-face--bottom", x: 90, y: 0, z: 0, label: "nav.contact" },
  ];
  const hashState = { work: 0, projects: 0, photography: 1, articles: 2, about: 3, contact: 4 };
  let state = -1;
  let transitioning = false;
  let introPlaying = false;
  let touchStartY = null;
  let idleTween = null;

  const mobile = () => window.innerWidth <= 900;
  const introTarget = () => ({ x: 0, y: 0, scale: mobile() ? 0.48 : 0.54 });
  const storyTarget = () => mobile()
    ? { x: window.innerWidth * (window.innerWidth <= 560 ? 0.04 : 0.42), y: 0, scale: Math.min(1.16, Math.max(1.06, window.innerWidth / 680)) }
    : { x: window.innerWidth * 0.42, y: window.innerHeight * 0.04, scale: 1.25 };

  const startIdle = () => {
    if (reduceMotion || !idleLayer || idleTween || state >= 0) return;
    idleTween = gsap.to(idleLayer, { rotationY: "+=360", duration: 18, ease: "none", repeat: -1 });
  };

  const stopIdle = () => {
    idleTween?.kill();
    idleTween = null;
  };

  const nav = (() => {
    const existing = hero.querySelector(".home-story-nav");
    if (existing) return existing;
    const element = document.createElement("nav");
    element.className = "home-story-nav";
    element.setAttribute("aria-label", "Home sections");
    element.innerHTML = chapters.map((chapter) => `<button type="button" data-story-nav="${chapter.name}" data-i18n="${chapter.label}"></button>`).join("");
    hero.querySelector(".spatial-hero__stage")?.append(element);
    return element;
  })();

  function setActive(index) {
    panels.forEach((panel, panelIndex) => panel.classList.toggle("is-active", panelIndex === index));
    document.querySelectorAll(".space-face").forEach((face) => face.classList.remove("is-active-face"));
    if (index >= 0) document.querySelector(chapters[index].face)?.classList.add("is-active-face");
    nav.querySelectorAll("[data-story-nav]").forEach((button) => {
      const active = button.dataset.storyNav === chapters[index]?.name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function settle() {
    setActive(state);
    if (state < 0) {
      document.body.classList.remove("story-active");
      gsap.set(viewport, introTarget());
      gsap.set(tiltLayer, { rotation: 0 });
      gsap.set(cube, { rotationX: -18, rotationY: 35, rotationZ: -2 });
      gsap.set(copy, { autoAlpha: 1, x: 0 });
      gsap.set(explore, { autoAlpha: 1, y: 0 });
      gsap.set(panels, { autoAlpha: 0, x: 24 });
      startIdle();
      return;
    }
    stopIdle();
    gsap.set(idleLayer, { rotationX: 0, rotationY: 0, rotationZ: 0 });
    document.body.classList.add("story-active");
    const chapter = chapters[state];
    gsap.set(viewport, storyTarget());
    gsap.set(tiltLayer, { rotation: 45 });
    gsap.set(cube, { rotationX: chapter.x, rotationY: chapter.y, rotationZ: chapter.z });
    gsap.set(copy, { autoAlpha: 0, x: -18 });
    gsap.set(explore, { autoAlpha: 0, y: 12 });
    panels.forEach((panel, index) => gsap.set(panel, { autoAlpha: index === state ? 1 : 0, x: index === state ? 0 : 24 }));
  }

  function showChapter(next, direction = 1) {
    if (transitioning || next < -1 || next >= chapters.length || next === state) return;
    transitioning = true;
    const previous = state;
    state = next;
    setActive(next);
    const timeline = gsap.timeline({ defaults: { overwrite: "auto" }, onComplete: () => { transitioning = false; settle(); } });
    const currentPanel = previous >= 0 ? panels[previous] : null;
    const nextPanel = next >= 0 ? panels[next] : null;
    if (currentPanel) timeline.to(currentPanel, { autoAlpha: 0, x: direction > 0 ? -18 : 18, duration: 0.22 }, 0);
    if (next < 0) {
      document.body.classList.remove("story-active");
      timeline.to(cube, { rotationX: -18, rotationY: 35, rotationZ: -2, duration: 0.72, ease: "expo.inOut" }, 0)
        .to(tiltLayer, { rotation: 0, duration: 0.72, ease: "expo.inOut" }, 0)
        .to(viewport, { ...introTarget(), duration: 0.72, ease: "expo.inOut" }, 0)
        .to(copy, { autoAlpha: 1, x: 0, duration: 0.28 }, 0.45)
        .to(explore, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.52);
      return;
    }
    const chapter = chapters[next];
    if (previous < 0) {
      stopIdle();
      gsap.set(idleLayer, { rotationX: 0, rotationY: 0, rotationZ: 0 });
      document.body.classList.add("story-active");
      timeline.to(copy, { autoAlpha: 0, x: -18, duration: 0.28 }, 0)
        .to(explore, { autoAlpha: 0, y: 12, duration: 0.2 }, 0)
        .to(viewport, { ...storyTarget(), duration: 0.78, ease: "expo.inOut" }, 0)
        .to(tiltLayer, { rotation: 45, duration: 0.78, ease: "expo.inOut" }, 0);
    }
    if (nextPanel) nextPanel.scrollTop = 0;
    timeline.to(cube, { rotationX: chapter.x, rotationY: chapter.y, rotationZ: chapter.z, duration: 0.72, ease: "expo.inOut" }, 0)
      .fromTo(nextPanel, { autoAlpha: 0, x: direction > 0 ? 18 : -18 }, { autoAlpha: 1, x: 0, duration: 0.36, ease: "expo.out" }, previous < 0 ? 0.38 : 0.16);
  }

  function selectChapter(index) {
    if (reduceMotion) {
      panels[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    showChapter(index, index >= state ? 1 : -1);
    history.replaceState(null, "", `#${chapters[index].name}`);
  }

  nav.querySelectorAll("[data-story-nav]").forEach((button) => button.addEventListener("click", () => {
    const index = chapters.findIndex((chapter) => chapter.name === button.dataset.storyNav);
    if (index >= 0) selectChapter(index);
  }));

  function activateHash() {
    const target = hashState[window.location.hash.slice(1)];
    if (target !== undefined && !transitioning && !introPlaying) selectChapter(target);
  }

  function resetHome() {
    state = -1;
    transitioning = false;
    window.scrollTo(0, 0);
    gsap.killTweensOf([viewport, tiltLayer, cube, copy, explore, ...panels]);
    settle();
    if (window.location.hash) window.setTimeout(activateHash, 50);
  }

  document.body.classList.add("story-ready");
  if (reduceMotion) {
    panels.forEach((panel) => panel.classList.add("is-active"));
  } else {
    document.body.classList.add("story-paged");
    settle();
    introPlaying = true;
    gsap.set(viewport, { ...introTarget(), autoAlpha: 0, y: 18, scale: mobile() ? 0.42 : 0.45 });
    gsap.set(copy, { autoAlpha: 0, y: 20 });
    gsap.set(explore, { autoAlpha: 0, y: 12 });
    gsap.timeline({ onComplete: () => { introPlaying = false; settle(); activateHash(); } })
      .to(viewport, { ...introTarget(), autoAlpha: 1, duration: 0.95, ease: "expo.out" }, 0.12)
      .to(copy, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.76)
      .to(explore, { autoAlpha: 1, y: 0, duration: 0.35 }, 1.02);

    window.addEventListener("wheel", (event) => {
      const activePanel = state >= 0 ? panels[state] : null;
      if (activePanel && event.clientX <= window.innerWidth * 0.5) {
        event.preventDefault();
        activePanel.scrollTop += event.deltaY;
        return;
      }
      event.preventDefault();
      if (Math.abs(event.deltaY) >= 18) showChapter(Math.max(-1, Math.min(chapters.length - 1, state + (event.deltaY > 0 ? 1 : -1))), event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); showChapter(Math.min(chapters.length - 1, state + 1), 1); }
      if (["ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); showChapter(Math.max(-1, state - 1), -1); }
    });

    window.addEventListener("touchstart", (event) => { touchStartY = event.touches[0]?.clientY ?? null; }, { passive: true });
    window.addEventListener("touchend", (event) => {
      if (touchStartY === null) return;
      const startY = touchStartY;
      touchStartY = null;
      if (event.target.closest("[data-story-panel].is-active")) return;
      const delta = startY - (event.changedTouches[0]?.clientY ?? startY);
      if (Math.abs(delta) > 42) showChapter(Math.max(-1, Math.min(chapters.length - 1, state + (delta > 0 ? 1 : -1))), delta > 0 ? 1 : -1);
    }, { passive: true });
  }

  document.addEventListener("click", (event) => {
    const face = event.target.closest?.(".space-face");
    if (face) {
      const index = chapters.findIndex((chapter) => document.querySelector(chapter.face) === face);
      if (index >= 0) { event.preventDefault(); selectChapter(index); return; }
    }
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor || reduceMotion) return;
    const target = hashState[anchor.getAttribute("href").slice(1)];
    if (target === undefined) return;
    event.preventDefault();
    selectChapter(target);
  });

  window.addEventListener("resize", () => { if (!transitioning && !introPlaying && !reduceMotion) settle(); }, { passive: true });
  window.addEventListener("pageshow", (event) => { if (event.persisted) resetHome(); });
  window.addEventListener("popstate", resetHome);
  document.documentElement.dataset.homeMotionBuild = "20260916-3";
})();
