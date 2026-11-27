// ==========================================================================
// svozar.com — Interactive Trajectory Planner, Spotlight, Filters & Theme
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Scroll progress bar
  const progressBar = document.querySelector(".scroll-progress");
  if (progressBar) {
    window.addEventListener("scroll", () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }, { passive: true });
  }

  // 2. Dark / Light theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("svozar-wild-theme");
  if (savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  }
  themeBtn?.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("svozar-wild-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("svozar-wild-theme", "light");
    }
  });

  // 3. Mouse-tracking radial spotlight on Bento cards
  document.querySelectorAll(".bento-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // 4. Scroll-reveal animations
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // 5. Interactive Patent filter pills
  const filterBtns = document.querySelectorAll(".filter-pill");
  const patentCards = document.querySelectorAll(".patent-card");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      patentCards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(" ");
        const show = filter === "all" || tags.includes(filter);
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  // 6. Live Autonomous Trajectory & Fallback Planner Canvas
  const canvas = document.getElementById("trajectory-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let t = 0;
  let fallbackTimer = 0;
  const FALLBACK_DURATION = 260; // frames

  const hudDot = document.getElementById("hud-dot");
  const hudLabel = document.getElementById("hud-label");
  const triggerBtn = document.getElementById("trigger-fallback");

  triggerBtn?.addEventListener("click", () => {
    fallbackTimer = FALLBACK_DURATION;
    hudDot?.classList.add("fallback");
    if (hudLabel) hudLabel.textContent = "MODE: FALLBACK_MANEUVER";
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // Subtle ambient perception points
  const lidarPts = Array.from({ length: 48 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
  }));

  function laneY(x, offset = 0) {
    const nx = x / Math.max(w, 1);
    return h * 0.56 + Math.sin(nx * 4.2 - t * 0.012) * 38 + Math.cos(nx * 2.1 + t * 0.007) * 18 + offset;
  }

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, w, h);

    const isFallback = fallbackTimer > 0;
    if (fallbackTimer > 0) {
      fallbackTimer -= 1;
      if (fallbackTimer === 0) {
        hudDot?.classList.remove("fallback");
        if (hudLabel) hudLabel.textContent = "MODE: NOMINAL_PLANNER";
      }
    }

    // Subtle grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.055)";
    ctx.lineWidth = 1;
    const step = 64;
    const shiftX = (t * 0.4) % step;
    for (let x = -shiftX; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Lidar / perception scatter dots
    lidarPts.forEach((p) => {
      const px = ((p.x * w - t * 0.35) % w + w) % w;
      const py = p.y * h;
      const alpha = 0.14 + 0.18 * Math.sin(t * 0.04 + p.phase);
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Corridor boundaries
    [-70, 70].forEach((off) => {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 18) {
        const y = laneY(x, off);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Candidate multi-policy branches (subtle)
    const egoX = w * 0.28;
    const egoY = laneY(egoX, isFallback ? Math.sin((1 - fallbackTimer / FALLBACK_DURATION) * Math.PI) * 52 : 0);

    [-46, 46].forEach((branchOff, idx) => {
      const highlight = isFallback && idx === 1;
      ctx.strokeStyle = highlight ? "rgba(245, 158, 11, 0.85)" : "rgba(56, 189, 248, 0.16)";
      ctx.lineWidth = highlight ? 2.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(egoX, egoY);
      for (let dx = 12; dx <= w * 0.55; dx += 14) {
        const frac = Math.min(1, dx / (w * 0.25));
        const ease = frac * frac * (3 - 2 * frac);
        const y = laneY(egoX + dx, branchOff * ease);
        ctx.lineTo(egoX + dx, y);
      }
      ctx.stroke();
    });

    // Nominal trajectory spline
    ctx.strokeStyle = isFallback ? "rgba(148, 163, 184, 0.25)" : "rgba(56, 189, 248, 0.72)";
    ctx.lineWidth = isFallback ? 1.5 : 2.6;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 14) {
      const y = laneY(x, 0);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Simulated obstacle when fallback is active
    if (isFallback) {
      const obsX = egoX + 145;
      const obsY = laneY(obsX, 0);
      ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
      ctx.beginPath();
      ctx.arc(obsX, obsY, 22 + Math.sin(t * 0.2) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.9)";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(obsX - 10, obsY - 10, 20, 20);
    }

    // Ego vehicle node + perception ring
    ctx.fillStyle = isFallback ? "rgba(245, 158, 11, 0.18)" : "rgba(56, 189, 248, 0.18)";
    ctx.beginPath();
    ctx.arc(egoX, egoY, 18 + Math.sin(t * 0.08) * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isFallback ? "#f59e0b" : "#38bdf8";
    ctx.beginPath();
    ctx.arc(egoX, egoY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});
