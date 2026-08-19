(() => {
  const markup = `
    <svg class="baifang-ip__svg" viewBox="0 0 320 320" role="img" aria-label="AI Baifang spatial character">
      <g class="baifang-ip__float">
        <g class="baifang-ip__fragments" aria-hidden="true">
          <path class="baifang-ip__fragment baifang-ip__fragment--a" d="M47 74h24v6H53v18h-6Z" />
          <path class="baifang-ip__fragment baifang-ip__fragment--b" d="M249 56h24v24h-6V62h-18Z" />
          <path class="baifang-ip__fragment baifang-ip__fragment--c" d="M46 236h6v18h18v6H46Z" />
          <path class="baifang-ip__fragment baifang-ip__fragment--d" d="M264 229h6v28h-28v-6h22Z" />
        </g>
        <g class="baifang-ip__character">
          <path class="baifang-ip__limb baifang-ip__arm--left" d="M80 145c-16 12-21 31-22 49" />
          <path class="baifang-ip__limb baifang-ip__arm--right" d="M224 144c16 12 21 31 22 49" />
          <path class="baifang-ip__limb baifang-ip__leg--left" d="M128 239c0 16 0 29-2 39l-10 5" />
          <path class="baifang-ip__limb baifang-ip__leg--right" d="M176 239c0 16 0 29 2 39l10 5" />
          <path class="baifang-ip__face baifang-ip__face--echo" d="M92 91c32-5 84-4 116 2 12 2 18 10 19 22 3 34 3 78-1 112-1 12-8 20-20 22-31 5-80 5-112 1-12-2-19-9-21-21-4-35-4-79 0-114 2-13 8-21 19-24Z" />
          <path class="baifang-ip__face baifang-ip__face--front" d="M92 91c32-5 84-4 116 2 12 2 18 10 19 22 3 34 3 78-1 112-1 12-8 20-20 22-31 5-80 5-112 1-12-2-19-9-21-21-4-35-4-79 0-114 2-13 8-21 19-24Z" />
          <g class="baifang-ip__eyes">
            <circle cx="132" cy="168" r="4" />
            <circle cx="169" cy="168" r="4" />
          </g>
        </g>
        <g class="baifang-ip__observer" aria-hidden="true">
          <path d="m276 124 18-10 18 10-18 10Z" />
          <path d="m276 124 18 10v20l-18-10Zm36 0-18 10v20l18-10Z" />
        </g>
      </g>
    </svg>`;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-baifang-ip]").forEach((host) => {
    host.classList.add("baifang-ip");
    host.innerHTML = markup;
    if (reduceMotion.matches) return;

    let frame = 0;
    const update = (event) => {
      const rect = host.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        host.style.setProperty("--bf-eye-x", `${x * 4}px`);
        host.style.setProperty("--bf-eye-y", `${y * 3}px`);
        host.style.setProperty("--bf-body-x", `${x * 3}px`);
        host.style.setProperty("--bf-body-y", `${y * 2}px`);
        host.style.setProperty("--bf-observer-x", `${x * 8}px`);
        host.style.setProperty("--bf-observer-y", `${y * 6}px`);
      });
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      host.style.removeProperty("--bf-eye-x");
      host.style.removeProperty("--bf-eye-y");
      host.style.removeProperty("--bf-body-x");
      host.style.removeProperty("--bf-body-y");
      host.style.removeProperty("--bf-observer-x");
      host.style.removeProperty("--bf-observer-y");
      host.classList.remove("is-observing");
    };

    host.addEventListener("pointerenter", () => host.classList.add("is-observing"));
    host.addEventListener("pointermove", update, { passive: true });
    host.addEventListener("pointerleave", reset);
  });
})();
