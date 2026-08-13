(() => {
  "use strict";

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const hero = document.querySelector("[data-home-hero]");
  if (!hero || !gsap) return;

  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(any-pointer: fine)").matches || navigator.maxTouchPoints === 0;
  const panels = gsap.utils.toArray("[data-story-panel]");
  const idleLayer = document.querySelector(".cube-idle-spin");
  const cube = document.querySelector(".spatial-cube");
  const viewport = document.querySelector(".cube-viewport");
  const tilt = document.querySelector(".cube-tilt");
  const copy = document.querySelector(".spatial-hero__copy");
  const heroTitle = document.querySelector(".spatial-hero__title");
  const heroSubtitle = document.querySelector(".spatial-hero__subtitle");
  const explore = document.querySelector(".spatial-hero__explore");
  const header = document.querySelector(".site-header");

  const chapters = [
    { name: "projects", face: ".space-face--front", rotationX: 0, rotationY: 360, rotationZ: 45 },
    { name: "photography", face: ".space-face--back", rotationX: 0, rotationY: 540, rotationZ: 45 },
    { name: "articles", face: ".space-face--right", rotationX: 0, rotationY: 630, rotationZ: 45 },
    { name: "about", face: ".space-face--top", rotationX: -90, rotationY: 720, rotationZ: 45 },
    { name: "contact", face: ".space-face--bottom", rotationX: 90, rotationY: 720, rotationZ: 45 },
  ];

  let state = -1;
  let transitioning = false;
  let idleYawTween = null;
  let idlePitchTween = null;
  let storyDriftTimeline = null;
  let touchStartY = null;
  let lastStepAt = -Infinity;
  let introPlaying = false;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const resetPageOrigin = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const visibleViewport = () => {
    return {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: document.documentElement.clientHeight || window.innerHeight,
      left: 0,
      top: 0,
    };
  };

  const startIdleRotation = () => {
    if (!idleLayer || reduceMotion || state !== -1 || idleYawTween) return;
    gsap.set(idleLayer, { rotationX: -7, transformOrigin: "50% 50%" });
    idleYawTween = gsap.to(idleLayer, { rotationY: "+=360", duration: 18, repeat: -1, ease: "none" });
    idlePitchTween = gsap.to(idleLayer, { rotationX: 7, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
  };

  const neutralizeIdleRotation = () => {
    idleYawTween?.kill();
    idlePitchTween?.kill();
    idleYawTween = null;
    idlePitchTween = null;
    storyDriftTimeline?.kill();
    storyDriftTimeline = null;
  };

  const resetMotionLayers = () => {
    neutralizeIdleRotation();
    gsap.killTweensOf([idleLayer, tilt]);
    gsap.set(idleLayer, {
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
    });
    gsap.set(tilt, {
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
    });
  };

  const startStoryDrift = () => {
    if (!idleLayer || reduceMotion || state < 0 || storyDriftTimeline) return;
    gsap.set(idleLayer, { transformOrigin: "50% 50%", force3D: true });
    storyDriftTimeline = gsap.timeline({ repeat: -1, yoyo: true })
      .to(idleLayer, {
        y: -10,
        x: 2,
        rotationX: 0.5,
        rotationY: -0.68,
        rotationZ: 0.34,
        duration: 4.4,
        ease: "sine.inOut",
      })
      .to(idleLayer, {
        y: 7,
        x: -2,
        rotationX: -0.38,
        rotationY: 0.52,
        rotationZ: -0.26,
        duration: 5.2,
        ease: "sine.inOut",
      });
  };

  const setActiveChapter = (index) => {
    panels.forEach((panel, panelIndex) => panel.classList.toggle("is-active", panelIndex === index));
    document.querySelectorAll(".space-face").forEach((face) => face.classList.remove("is-active-face"));
    const activeFace = index >= 0 ? document.querySelector(chapters[index].face) : null;
    activeFace?.classList.add("is-active-face");
  };

  const storyViewportTarget = () => {
    const visible = visibleViewport();
    const mobile = visible.width <= 900;
    const cubeSize = viewport?.offsetWidth || Math.min(visible.height * 0.72, 672);
    const desiredCenterX = mobile
      ? visible.left + visible.width * 0.94
      : visible.left + visible.width * 0.89;
    const restingCenterX = window.innerWidth * 0.5;
    const desiredCenterY = visible.top + visible.height * (mobile ? 0.49 : 0.5);
    const restingCenterY = window.innerHeight * (mobile ? 0.39 : 0.42);
    return {
      x: desiredCenterX - restingCenterX,
      y: desiredCenterY - restingCenterY,
      scale: 1,
    };
  };

  const introViewportTarget = () => ({
    x: 0,
    y: 0,
    scale: visibleViewport().width <= 900 ? 0.54 : 0.54,
  });

  const snapSettledState = ({ restartIdle = true } = {}) => {
    const inStory = state >= 0;
    setActiveChapter(state);

    if (inStory) {
      const chapter = chapters[state];
      resetMotionLayers();
      document.body.classList.add("story-active");
      gsap.set(viewport, storyViewportTarget());
      gsap.set(cube, {
        rotationX: chapter.rotationX,
        rotationY: chapter.rotationY,
        rotationZ: chapter.rotationZ,
      });
      gsap.set(copy, { autoAlpha: 0, x: -18 });
      gsap.set(explore, { autoAlpha: 0, y: 12 });
      panels.forEach((panel, index) => {
        gsap.set(panel, { autoAlpha: index === state ? 1 : 0, x: index === state ? 0 : 24 });
      });
      startStoryDrift();
      return;
    }

    resetMotionLayers();
    document.body.classList.remove("story-active");
    gsap.set(viewport, introViewportTarget());
    gsap.set(cube, { rotationX: -18, rotationY: 35, rotationZ: -2 });
    gsap.set(copy, { autoAlpha: 1, x: 0 });
    gsap.set(explore, { autoAlpha: 1, y: 0 });
    gsap.set(panels, { autoAlpha: 0, x: 24 });
    if (restartIdle) startIdleRotation();
  };

  const playIntroEntrance = () => {
    const target = introViewportTarget();
    introPlaying = true;
    gsap.set(header, { autoAlpha: 0, y: -12 });
    gsap.set(viewport, { ...target, autoAlpha: 0, y: 18, scale: target.scale * 0.84 });
    gsap.set(copy, { autoAlpha: 0, x: 0, y: 20 });
    gsap.set(explore, { autoAlpha: 0, y: 12 });

    gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        introPlaying = false;
        gsap.set(viewport, { ...introViewportTarget(), autoAlpha: 1 });
        startIdleRotation();
      },
    })
      .to(header, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.08)
      .to(viewport, { ...target, autoAlpha: 1, duration: 1.15, ease: "expo.out" }, 0.42)
      .to(copy, { autoAlpha: 1, y: 0, duration: 0.72, ease: "power3.out" }, 1.18)
      .to(explore, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }, 1.48)
      .call(startIdleRotation, [], 0.98);
  };

  const showChapter = (nextState, direction) => {
    if (transitioning || nextState < -1 || nextState >= chapters.length || nextState === state) return;
    transitioning = true;

    const previousState = state;
    const previousPanel = previousState >= 0 ? panels[previousState] : null;
    const nextPanel = nextState >= 0 ? panels[nextState] : null;
    const enteringStory = previousState === -1 && nextState >= 0;
    const leavingStory = previousState === 0 && nextState === -1;
    state = nextState;
    setActiveChapter(nextState);

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        transitioning = false;
        snapSettledState();
      },
    });

    if (previousPanel) {
      timeline.to(previousPanel, {
        autoAlpha: 0,
        x: direction > 0 ? -18 : 18,
        duration: 0.28,
        ease: "power2.inOut",
      }, 0);
    }

    if (enteringStory) {
      document.body.classList.add("story-active");
      neutralizeIdleRotation();
      timeline
        .to(copy, { autoAlpha: 0, x: -18, duration: 0.36, ease: "power2.in" }, 0)
        .to(explore, { autoAlpha: 0, y: 12, duration: 0.28, ease: "power2.in" }, 0)
        .to(idleLayer, { rotationX: 0, rotationY: 0, rotationZ: 0, duration: 0.92, ease: "power2.inOut" }, 0)
        .to(viewport, { ...storyViewportTarget(), duration: 1.02, ease: "expo.inOut" }, 0);
    }

    if (nextState >= 0) {
      const chapter = chapters[nextState];
      timeline.to(cube, {
        rotationX: chapter.rotationX,
        rotationY: chapter.rotationY,
        rotationZ: chapter.rotationZ,
        duration: enteringStory ? 1.02 : 0.8,
        ease: enteringStory ? "expo.inOut" : "power2.inOut",
      }, 0);

      nextPanel.scrollTop = 0;
      timeline.fromTo(nextPanel, {
        autoAlpha: 0,
        x: direction > 0 ? 22 : -22,
      }, {
        autoAlpha: 1,
        x: 0,
        duration: 0.46,
        ease: "expo.out",
        immediateRender: false,
      }, enteringStory ? 0.52 : 0.22);
    }

    if (leavingStory) {
      document.body.classList.remove("story-active");
      neutralizeIdleRotation();
      timeline
        .to(cube, { rotationX: -18, rotationY: 35, rotationZ: -2, duration: 0.92, ease: "expo.inOut" }, 0)
        .to(viewport, { ...introViewportTarget(), duration: 0.92, ease: "expo.inOut" }, 0)
        .to(copy, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, 0.74)
        .to(explore, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" }, 0.8)
        .to(idleLayer, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, duration: 0.32, ease: "power2.out" }, 0.54)
        .to(tilt, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, duration: 0.32, ease: "power2.out" }, 0.54);
    }
  };

  const requestStep = (direction) => {
    if (transitioning) return;
    const next = gsap.utils.clamp(-1, chapters.length - 1, state + direction);
    if (next === state) return;
    const now = performance.now();
    if (now - lastStepAt < 1150) return;
    lastStepAt = now;
    showChapter(next, direction);
  };

  if (!reduceMotion) {
    resetPageOrigin();
    document.body.classList.add("story-ready", "story-paged");
    gsap.set(panels, { autoAlpha: 0, x: 24 });
    snapSettledState({ restartIdle: false });
    playIntroEntrance();

    window.addEventListener("wheel", (event) => {
      const activePanel = state >= 0 ? panels[state] : null;
      const inContentZone = activePanel && event.clientX <= window.innerWidth * 0.5;
      if (inContentZone) {
        event.preventDefault();
        activePanel.scrollTop += event.deltaY;
        return;
      }
      event.preventDefault();
      if (Math.abs(event.deltaY) < 18) return;
      requestStep(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        requestStep(1);
      } else if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        requestStep(-1);
      }
    });

    window.addEventListener("touchstart", (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    }, { passive: true });

    window.addEventListener("touchend", (event) => {
      if (touchStartY === null || event.target.closest("[data-story-panel].is-active")) return;
      const endY = event.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      touchStartY = null;
      if (Math.abs(delta) > 48) requestStep(delta > 0 ? 1 : -1);
    }, { passive: true });
  } else {
    document.body.classList.add("story-ready");
    panels.forEach((panel) => panel.classList.add("is-active"));
  }

  const hashState = { work: 0, about: 3, contact: 4 };
  window.addEventListener("site:language-change", () => {
    if (state >= 0) setActiveChapter(state);
  });

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (!transitioning && !introPlaying && !reduceMotion) snapSettledState();
    });
  }, { passive: true });

  window.visualViewport?.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (!transitioning && !introPlaying && !reduceMotion) snapSettledState();
    });
  }, { passive: true });

  const restoreStableHomeState = () => {
    if (reduceMotion) return;
    transitioning = false;
    state = -1;
    resetPageOrigin();
    gsap.killTweensOf([viewport, cube, idleLayer, tilt, copy, explore, ...panels]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetPageOrigin();
        snapSettledState();
      });
    });
    window.setTimeout(() => {
      if (!transitioning) snapSettledState();
    }, 180);
  };

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted && performance.now() < 1200) return;
    restoreStableHomeState();
  });
  window.addEventListener("popstate", restoreStableHomeState);
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || reduceMotion) return;
    const target = anchor.getAttribute("href").slice(1);
    if (!(target in hashState)) return;
    event.preventDefault();
    const nextState = hashState[target];
    const direction = nextState > state ? 1 : -1;
    showChapter(nextState, direction);
    history.replaceState(null, "", `#${target}`);
  });

  if (!reduceMotion) {
    const tiltX = tilt ? gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3.out" }) : null;
    const tiltY = tilt ? gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3.out" }) : null;
    const floatX = tilt ? gsap.quickTo(tilt, "x", { duration: 0.72, ease: "power3.out" }) : null;
    const floatY = tilt ? gsap.quickTo(tilt, "y", { duration: 0.72, ease: "power3.out" }) : null;
    const titleX = heroTitle ? gsap.quickTo(heroTitle, "x", { duration: 0.65, ease: "power3.out" }) : null;
    const titleY = heroTitle ? gsap.quickTo(heroTitle, "y", { duration: 0.65, ease: "power3.out" }) : null;
    const subtitleX = heroSubtitle ? gsap.quickTo(heroSubtitle, "x", { duration: 0.8, ease: "power3.out" }) : null;

    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const px = event.clientX / window.innerWidth - 0.5;
      const py = event.clientY / window.innerHeight - 0.5;
      tiltX?.(-py * (state >= 0 ? 7 : 4));
      tiltY?.(px * (state >= 0 ? 10 : 6));
      floatX?.(state >= 0 ? px * 10 : 0);
      floatY?.(state >= 0 ? py * 8 : 0);
      titleX?.(state < 0 ? px * 8 : 0);
      titleY?.(state < 0 ? py * 5 : 0);
      subtitleX?.(state < 0 ? px * -4 : 0);
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      tiltX?.(0);
      tiltY?.(0);
      floatX?.(0);
      floatY?.(0);
      titleX?.(0);
      titleY?.(0);
      subtitleX?.(0);
    });
  }

  document.documentElement.dataset.homeMotionBuild = "20260813-1";
})();
