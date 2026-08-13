(() => {
  "use strict";

  const canvas = document.querySelector("[data-cube-field]");
  const stage = canvas?.closest(".spatial-hero__stage");
  if (!canvas || !stage) return;

  const context = canvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
  const TAU = Math.PI * 2;
  const ISO_X = Math.cos(Math.PI / 6);
  const ISO_Y = Math.sin(Math.PI / 6);
  const baseVertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  let running = true;
  let structures = [];
  let previousTime = performance.now();
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, lastX: 0, lastY: 0 };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smoothstep = (from, to, value) => {
    const t = clamp((value - from) / (to - from), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const seeded = (value) => {
    const wave = Math.sin(value * 91.3458 + 17.173) * 47453.5453;
    return wave - Math.floor(wave);
  };

  const resetStructure = (structure, initial = false) => {
    const margin = Math.min(width, height) * 0.08;
    const side = Math.random() < 0.5 ? -1 : 1;
    const sideBand = width * (width < 900 ? 0.2 : 0.25);
    structure.seed = Math.random() * 1000;
    structure.x = side < 0
      ? margin + Math.random() * sideBand
      : width - margin - Math.random() * sideBand;
    structure.y = margin + Math.random() * Math.max(1, height - margin * 2);
    structure.originX = structure.x;
    structure.originY = structure.y;
    structure.size = 6 + Math.random() * (width < 900 ? 8 : 13);
    structure.birth = performance.now() - (initial ? Math.random() * 12000 : 0);
    structure.life = 6000 + Math.random() * 6500;
    structure.driftX = 16 + Math.random() * 42;
    structure.driftY = 16 + Math.random() * 54;
    structure.driftRate = 0.000035 + Math.random() * 0.000055;
    structure.phase = Math.random() * TAU;
    structure.interactive = Math.random() > 0.32;
    structure.edgeOrder = edges.map((_, index) => seeded(structure.seed + index * 8.13));
    structure.vertexImpulse = baseVertices.map(() => ({ x: 0, y: 0 }));
  };

  const createStructure = (initial) => {
    const structure = {};
    resetStructure(structure, initial);
    return structure;
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = reduceMotion ? 9 : width < 900 ? 14 : Math.min(26, Math.max(19, Math.round(width / 92)));
    structures = Array.from({ length: count }, () => createStructure(true));
    if (reduceMotion) render(performance.now());
  };

  const projectIsometric = ([x, y, z], structure, split, vertexIndex, time) => {
    const seed = structure.seed + vertexIndex * 13.73;
    const vertexPhase = structure.phase + vertexIndex * 0.81;
    const orbitRate = 0.00062 + seeded(seed) * 0.00042;
    const orbit = time * orbitRate + vertexPhase;
    const deform = smoothstep(0.14, 0.44, split) * (1 - smoothstep(0.88, 1, split));
    const pathX = Math.sin(orbit) * (0.08 + seeded(seed + 2) * 0.13) * deform;
    const pathY = Math.cos(orbit * (1.13 + seeded(seed + 4) * 0.31)) * (0.07 + seeded(seed + 5) * 0.14) * deform;
    const pathZ = Math.sin(orbit * (0.74 + seeded(seed + 7) * 0.26) + 1.7) * (0.08 + seeded(seed + 9) * 0.12) * deform;

    const fracture = smoothstep(0.57, 0.84, split);
    const fractureDistance = fracture * structure.size * (0.18 + seeded(seed + 11) * 0.34);
    const fragmentX = (x * 0.55 + (seeded(seed + 12) - 0.5) * 0.7) * fractureDistance;
    const fragmentY = (y * 0.38 + z * 0.22 + (seeded(seed + 14) - 0.5) * 0.55) * fractureDistance;

    const isoX = (x + pathX - (z + pathZ)) * ISO_X * structure.size;
    const isoY = ((x + pathX + z + pathZ) * ISO_Y - (y + pathY)) * structure.size;
    const impulse = structure.vertexImpulse[vertexIndex];
    return [structure.x + isoX + fragmentX + impulse.x, structure.y + isoY + fragmentY + impulse.y];
  };

  const drawStructure = (structure, time, delta, lineColor) => {
    let age = (time - structure.birth) / structure.life;
    if (age >= 1) {
      resetStructure(structure);
      age = 0;
    }

    structure.x = structure.originX + Math.sin(time * structure.driftRate + structure.phase) * structure.driftX;
    structure.y = structure.originY + Math.cos(time * structure.driftRate * 0.83 + structure.phase * 1.31) * structure.driftY;

    const fadeIn = smoothstep(0, 0.12, age);
    const fadeOut = 1 - smoothstep(0.78, 1, age);
    const opacity = fadeIn * fadeOut;
    const projected = baseVertices.map((vertex, index) => projectIsometric(vertex, structure, age, index, time));

    if (pointer.active && structure.interactive) {
      const dx = structure.x - pointer.x;
      const dy = structure.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const radius = 185;
      if (distance < radius) {
        const proximity = (1 - distance / radius) ** 2;
        projected.forEach((point, index) => {
          if (seeded(structure.seed + index * 21.4) < 0.46) return;
          const pointDx = point[0] - pointer.x;
          const pointDy = point[1] - pointer.y;
          const pointDistance = Math.hypot(pointDx, pointDy) || 1;
          const direction = seeded(structure.seed + index * 9.7) > 0.42 ? 1 : -0.45;
          const force = proximity * (3.5 + Math.min(12, Math.hypot(pointer.vx, pointer.vy) * 0.48));
          structure.vertexImpulse[index].x += (pointDx / pointDistance * force * direction + pointer.vx * 0.08) * delta;
          structure.vertexImpulse[index].y += (pointDy / pointDistance * force * direction + pointer.vy * 0.08) * delta;
        });
      }
    }

    structure.vertexImpulse.forEach((impulse) => {
      impulse.x *= Math.pow(0.88, delta);
      impulse.y *= Math.pow(0.88, delta);
      impulse.x = clamp(impulse.x, -32, 32);
      impulse.y = clamp(impulse.y, -32, 32);
    });

    const fracture = smoothstep(0.58, 0.9, age);
    context.lineWidth = 0.82;
    edges.forEach(([from, to], edgeIndex) => {
      const breakThreshold = structure.edgeOrder[edgeIndex];
      const edgeVisibility = 1 - smoothstep(breakThreshold * 0.72, Math.min(1, breakThreshold * 0.72 + 0.24), fracture);
      if (edgeVisibility <= 0.025) return;
      context.beginPath();
      context.moveTo(projected[from][0], projected[from][1]);
      context.lineTo(projected[to][0], projected[to][1]);
      context.strokeStyle = lineColor.replace("ALPHA", (opacity * edgeVisibility * (0.19 + structure.size / 520)).toFixed(3));
      context.stroke();
    });

    if (fracture > 0.18) {
      projected.forEach((point, index) => {
        if (seeded(structure.seed + index * 4.41) < fracture * 0.58) {
          context.beginPath();
          context.arc(point[0], point[1], 0.65, 0, TAU);
          context.fillStyle = lineColor.replace("ALPHA", (opacity * fracture * 0.26).toFixed(3));
          context.fill();
        }
      });
    }
  };

  function render(time = performance.now()) {
    if (!running) return;
    const delta = clamp((time - previousTime) / 16.667, 0.25, 2.5);
    previousTime = time;
    context.clearRect(0, 0, width, height);
    const lightTheme = document.documentElement.dataset.theme === "light";
    const lineColor = lightTheme ? "rgba(18, 22, 20, ALPHA)" : "rgba(255, 255, 255, ALPHA)";
    structures.forEach((structure) => drawStructure(structure, time, delta, lineColor));
    pointer.vx *= 0.78;
    pointer.vy *= 0.78;
    if (!reduceMotion) frame = requestAnimationFrame(render);
  }

  if (finePointer && !reduceMotion) {
    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      const nextX = event.clientX - rect.left;
      const nextY = event.clientY - rect.top;
      pointer.vx = clamp(nextX - pointer.lastX, -28, 28);
      pointer.vy = clamp(nextY - pointer.lastY, -28, 28);
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.lastX = nextX;
      pointer.lastY = nextY;
      pointer.active = true;
    }, { passive: true });
    stage.addEventListener("pointerenter", (event) => {
      const rect = stage.getBoundingClientRect();
      pointer.lastX = event.clientX - rect.left;
      pointer.lastY = event.clientY - rect.top;
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
    }, { passive: true });
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    cancelAnimationFrame(frame);
    previousTime = performance.now();
    if (running) render(previousTime);
  });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("site:theme-change", () => render(performance.now()));

  resize();
  render();
  document.documentElement.dataset.spaceFieldBuild = "20260812-2";
})();
