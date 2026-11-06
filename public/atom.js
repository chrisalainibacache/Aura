// Átomo de luz de AURA, dibujado en canvas: nítido en pantallas de alta resolución (hasta ~4K).
// Estados: idle (respira), listening (ondas hacia adentro), thinking (órbitas rápidas), speaking (late con la voz).
// Sin parpadeos bruscos: todo se suaviza. Si el movimiento está reducido o "Menos estímulos", dibuja un cuadro quieto.
(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const GLOW = [127, 214, 230];
  const CORE = [232, 251, 255];
  const RING = [112, 200, 232];
  const MAX_SIDE = 2304; // límite de píxeles del lienzo (≈ altura de 4K)
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

  // Parámetros objetivo por estado; se acercan suavemente a ellos.
  const STATES = {
    idle:      { speed: 0.35, glow: 0.55, swirl: 0.15, wobble: 0.0, ripple: 0 },
    listening: { speed: 0.6,  glow: 0.8,  swirl: 0.3,  wobble: 0.1, ripple: -1 },
    thinking:  { speed: 1.5,  glow: 0.75, swirl: 1.0,  wobble: 0.15, ripple: 0 },
    speaking:  { speed: 0.9,  glow: 0.9,  swirl: 0.5,  wobble: 0.5, ripple: 1 },
  };

  function create(canvas) {
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx || !ctx.ellipse) return null;
    const motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    let state = "idle", still = false, levelFn = null, quality = 1;
    let w = 0, raf = 0, last = 0, t = 0, level = 0;
    let slow = 0, frames = 0;
    const cur = { ...STATES.idle };
    const seed = Math.random() * 100;
    const orbits = [
      { tilt: 0,           prec: 0.05,  ry: 0.36, phase: 0,   dir: 1,  pos: 0 },
      { tilt: Math.PI / 3, prec: -0.04, ry: 0.34, phase: 2.1, dir: -1, pos: 2.1 },
      { tilt: TAU / 3,     prec: 0.03,  ry: 0.38, phase: 4.2, dir: 1,  pos: 4.2 },
    ];
    const dust = Array.from({ length: 150 }, () => ({
      a: Math.random() * TAU, r: 0.25 + Math.random() * 0.7, s: (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? -1 : 1),
      z: Math.random(), p: Math.random() * TAU,
    }));
    const ripples = [];
    let rippleClock = 0;

    const animating = () => !still && !motion.matches;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 3) * quality;
      const side = Math.max(2, Math.min(Math.round(rect.width * ratio), MAX_SIDE));
      if (canvas.width !== side) { canvas.width = side; canvas.height = side; }
      w = side;
      if (!animating()) { snap(); draw(0); }
    }

    function snap() { Object.assign(cur, STATES[state]); level = 0; }

    // Nivel de voz simulado (cuando no hay audio que medir, por ejemplo con la voz del teléfono).
    function simulated() {
      const x = t * 4.2 + seed;
      const v = 0.30 + 0.28 * Math.abs(Math.sin(x)) * (0.65 + 0.35 * Math.sin(t * 1.3)) + 0.12 * Math.abs(Math.sin(x * 2.3));
      return Math.min(0.8, v);
    }

    function update(dt) {
      const target = STATES[state];
      const k = 1 - Math.exp(-dt * 3);
      for (const key of Object.keys(target)) cur[key] += (target[key] - cur[key]) * k;
      let want = 0;
      if (state === "speaking") {
        let raw = null;
        try { raw = levelFn ? levelFn() : null; } catch { raw = null; }
        want = raw == null ? simulated() : Math.min(1, raw);
      } else if (state === "listening") {
        want = 0.12;
      }
      // Ataque rápido y caída lenta: evita parpadeos.
      level += (want - level) * (1 - Math.exp(-dt * (want > level ? 18 : 6)));
    }

    function circle(x, y, r, fill) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function radial(x, y, r, stops) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, r));
      stops.forEach(([o, c]) => g.addColorStop(o, c));
      return g;
    }

    function draw(dt) {
      if (!w) return;
      const unit = w / 1000;
      const cx = w / 2, cy = w / 2;
      const R = (w / 1.36) * 0.5 * 0.98; // el lienzo es 1,36 veces el átomo para dejar espacio al brillo
      const g = cur.glow * (animating() ? 1 : 0.7);

      ctx.clearRect(0, 0, w, w);
      ctx.globalCompositeOperation = "lighter";

      // Halo
      const hr = R * (1.25 + 0.22 * level);
      ctx.fillStyle = radial(cx, cy, hr, [[0, rgba(GLOW, 0.34 * g * (0.8 + 0.4 * level))], [1, rgba(GLOW, 0)]]);
      ctx.fillRect(0, 0, w, w);

      // Polvo de luz
      for (const p of dust) {
        p.a += p.s * dt * (0.08 + cur.swirl * 0.35);
        const rr = R * p.r * (1 + 0.06 * level * Math.sin(t * 2 + p.p));
        const x = cx + Math.cos(p.a) * rr, y = cy + Math.sin(p.a) * rr * 0.9;
        const a = (0.1 + 0.3 * p.z) * (0.6 + 0.4 * Math.sin(t * 1.3 + p.p)) * g;
        circle(x, y, (0.6 + 1.6 * p.z) * unit, rgba(GLOW, a));
      }

      // Ondas de luz: hacia afuera al hablar, hacia adentro al escuchar
      if (cur.ripple !== 0 && Math.abs(cur.ripple) > 0.5) {
        rippleClock += dt;
        if (rippleClock > 0.9 - 0.4 * level && ripples.length < 4) {
          ripples.push({ p: 0, dir: Math.sign(cur.ripple) });
          rippleClock = 0;
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.p += dt * 0.45;
        if (rp.p >= 1) { ripples.splice(i, 1); continue; }
        const rad = rp.dir > 0 ? R * (0.2 + 0.85 * rp.p) : R * (1.05 - 0.85 * rp.p);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, TAU);
        ctx.lineWidth = 2 * unit;
        ctx.strokeStyle = rgba(GLOW, 0.32 * g * (1 - rp.p));
        ctx.stroke();
      }

      // Órbitas y electrones con estela
      for (const o of orbits) {
        const angle = o.tilt + o.prec * t + cur.wobble * 0.12 * Math.sin(t * 1.7 + o.phase);
        const ry = o.ry * (1 + cur.wobble * 0.25 * level + 0.04 * Math.sin(t * 0.9 + o.phase));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, R, R * ry, 0, 0, TAU);
        ctx.lineWidth = 6 * unit;
        ctx.strokeStyle = rgba(RING, 0.05 * g);
        ctx.stroke();
        ctx.lineWidth = 1.6 * unit;
        ctx.strokeStyle = rgba(RING, (0.28 + 0.25 * level) * g);
        ctx.stroke();

        o.pos += dt * o.dir * 0.8 * cur.speed * (1 + 1.6 * level);
        const TRAIL = 22;
        for (let k = TRAIL; k >= 0; k--) {
          const tt = o.pos - o.dir * k * 0.045;
          const ex = R * Math.cos(tt), ey = R * ry * Math.sin(tt);
          const depth = Math.sin(tt); // adelante (>0) o atrás (<0)
          const size = (3.4 - k * 0.1) * unit * (0.75 + 0.35 * depth);
          const fade = Math.pow(1 - k / (TRAIL + 1), 2);
          const a = fade * 0.9 * g * (0.6 + 0.4 * (depth * 0.5 + 0.5));
          if (k === 0) {
            circle(ex, ey, size * 4.5, radial(ex, ey, size * 4.5, [[0, rgba(CORE, 0.9 * g)], [0.35, rgba(GLOW, 0.4 * g)], [1, rgba(GLOW, 0)]]));
            circle(ex, ey, size, rgba(CORE, Math.min(1, 0.95 * g + 0.1)));
          } else {
            circle(ex, ey, size, rgba(GLOW, a));
          }
        }
        ctx.restore();
      }

      // Núcleo: respira en reposo y late con la voz
      const pulse = 1 + 0.035 * Math.sin(t * 0.9) + level * 0.32;
      const r0 = R * 0.15 * pulse;
      circle(cx, cy, r0 * 5.5, radial(cx, cy, r0 * 5.5, [[0, rgba(GLOW, 0.5 * g)], [0.4, rgba(GLOW, 0.16 * g)], [1, rgba(GLOW, 0)]]));
      ctx.globalCompositeOperation = "source-over";
      circle(cx, cy, r0, radial(cx - r0 * 0.2, cy - r0 * 0.25, r0 * 1.15, [[0, rgba(CORE, 1)], [0.35, "rgba(189,239,247,1)"], [1, "rgba(79,182,201,1)"]]));
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(cx, cy, r0 * 1.35, 0, TAU);
      ctx.lineWidth = 1.5 * unit;
      ctx.strokeStyle = rgba(GLOW, 0.25 * g * (0.5 + level));
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    // Si el dispositivo va justo, baja la resolución del lienzo en vez de entrecortar el movimiento.
    function governor(dt) {
      frames += 1;
      if (dt > 0.032) slow += 1;
      if (frames >= 90) {
        if (slow > 45 && quality > 0.5) { quality = quality === 1 ? 0.75 : 0.5; resize(); }
        frames = 0; slow = 0;
      }
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
      last = ts;
      t += dt;
      update(dt);
      draw(dt);
      governor(dt);
    }

    function sync() {
      if (animating()) {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      } else {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        snap();
        draw(0);
      }
    }

    if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    if (motion.addEventListener) motion.addEventListener("change", sync);

    resize();
    sync();

    return {
      setState(s) { state = STATES[s] ? s : "idle"; if (!animating()) { snap(); draw(0); } },
      setLevelSource(fn) { levelFn = typeof fn === "function" ? fn : null; },
      setStill(on) { still = Boolean(on); sync(); },
    };
  }

  window.AuraAtom = { create };
})();
