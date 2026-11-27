// ==========================================================================
// svozar.com — Light-Mode Autonomous Trajectory Canvas, Spotlight & Filters
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

  // 2. Mouse-tracking radial spotlight on Bento cards
  document.querySelectorAll(".bento-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // 3. Scroll-reveal animations
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

  // 4. Interactive Patent filter pills
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

  // 5. Subtle Light-Mode Autonomous Trajectory & Multi-Policy Canvas
  const canvas = document.getElementById("trajectory-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let t = 0;

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

  const lidarPts = Array.from({ length: 44 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1.2 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
  }));

  function laneY(x, offset = 0) {
    const nx = x / Math.max(w, 1);
    return h * 0.56 + Math.sin(nx * 4.0 - t * 0.01) * 36 + Math.cos(nx * 2.0 + t * 0.006) * 16 + offset;
  }

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, w, h);

    // Subtle blueprint grid
    ctx.strokeStyle = "rgba(15, 23, 42, 0.04)";
    ctx.lineWidth = 1;
    const step = 64;
    const shiftX = (t * 0.35) % step;
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

    // Soft ambient perception points
    lidarPts.forEach((p) => {
      const px = ((p.x * w - t * 0.3) % w + w) % w;
      const py = p.y * h;
      const alpha = 0.08 + 0.1 * Math.sin(t * 0.035 + p.phase);
      ctx.fillStyle = `rgba(29, 78, 216, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Corridor boundaries
    [-70, 70].forEach((off) => {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.09)";
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

    // Candidate multi-policy branches
    const egoX = w * 0.28;
    const egoY = laneY(egoX, 0);

    [-46, 46].forEach((branchOff) => {
      ctx.strokeStyle = "rgba(2, 132, 199, 0.18)";
      ctx.lineWidth = 1.4;
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

    // Primary nominal trajectory spline
    ctx.strokeStyle = "rgba(29, 78, 216, 0.34)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 14) {
      const y = laneY(x, 0);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Subtle ego vehicle node + pulse ring
    ctx.fillStyle = "rgba(29, 78, 216, 0.1)";
    ctx.beginPath();
    ctx.arc(egoX, egoY, 17 + Math.sin(t * 0.07) * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(29, 78, 216, 0.72)";
    ctx.beginPath();
    ctx.arc(egoX, egoY, 4.8, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});
