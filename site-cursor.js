(() => {
  "use strict";

  const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cursor = null;
  let label = null;
  let currentX = window.innerWidth * 0.5;
  let currentY = window.innerHeight * 0.5;
  let targetX = currentX;
  let targetY = currentY;
  let frame = 0;

  const syncInteractiveState = (target) => {
    if (!cursor) return;
    const interactive = target?.closest?.("a, button, [role='button'], [data-cursor]");
    cursor.classList.toggle("is-interactive", Boolean(interactive));
    cursor.classList.toggle("is-face", Boolean(interactive?.classList.contains("space-face")));
    if (interactive && label) {
      label.textContent = interactive.dataset.cursor || (interactive.matches("button") ? "SET" : "OPEN");
    }
  };

  const render = () => {
    if (!cursor) return;
    currentX += (targetX - currentX) * 0.28;
    currentY += (targetY - currentY) * 0.28;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      frame = requestAnimationFrame(render);
    } else {
      frame = 0;
    }
  };

  const enableCursor = () => {
    if (cursor) return cursor;
    cursor = document.querySelector(".spatial-cursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.className = "spatial-cursor";
      cursor.setAttribute("aria-hidden", "true");
      cursor.innerHTML = `<span class="spatial-cursor__corners"></span><span class="spatial-cursor__dot"></span><span class="spatial-cursor__label">OPEN</span>`;
      document.body.appendChild(cursor);
    }
    label = cursor.querySelector(".spatial-cursor__label");
    document.body.classList.add("custom-cursor-active");
    return cursor;
  };

  const handlePointerMove = (event) => {
    if (!cursor && (finePointer.matches || event.pointerType === "mouse")) enableCursor();
    if (!cursor) return;
    targetX = event.clientX;
    targetY = event.clientY;
    syncInteractiveState(event.target);
    cursor.style.opacity = "1";
    if (reduceMotion) {
      currentX = targetX;
      currentY = targetY;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    } else if (!frame) {
      frame = requestAnimationFrame(render);
    }
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => {
    if (cursor) cursor.style.opacity = "0";
  });
  document.addEventListener("pointerover", (event) => syncInteractiveState(event.target));
  document.addEventListener("pointerout", (event) => {
    if (!event.target.closest("a, button, [role='button'], [data-cursor]")) return;
    if (event.relatedTarget?.closest?.("a, button, [role='button'], [data-cursor]")) return;
    syncInteractiveState(event.relatedTarget);
  });

  if (finePointer.matches) enableCursor();
  document.documentElement.dataset.cursorBuild = "20260812-1";
})();
