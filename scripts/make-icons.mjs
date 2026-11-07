// Genera los íconos de AURA (SVG y PNG) con el átomo de luz.
// Uso: node scripts/make-icons.mjs   (requiere Playwright instalado; solo para regenerar los íconos)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const PUBLIC = new URL("../public/", import.meta.url).pathname;
const ORBITS = [{ a: 0, t: 0.7 }, { a: 60, t: 2.6 }, { a: 120, t: 4.5 }];
const RX = 190, RY = 66;

function point(a, t, rx = RX, ry = RY) {
  const x = rx * Math.cos(t), y = ry * Math.sin(t), r = (a * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
}

// scale: tamaño del átomo; shape: "tile" (esquinas redondeadas) o "bleed" (a sangre, para íconos adaptables y de iOS)
function svg({ scale, shape }) {
  const orbits = ORBITS.map(({ a }) => `<ellipse rx="${RX}" ry="${RY}" transform="rotate(${a})"/>`).join("");
  const electrons = ORBITS.map(({ a, t }) => {
    const trail = [1, 2, 3, 4, 5].map((k) => {
      const [x, y] = point(a, t - k * 0.13);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(11 - k * 1.6).toFixed(1)}" fill="#bdeff7" opacity="${(0.55 - k * 0.09).toFixed(2)}"/>`;
    }).join("");
    const [x, y] = point(a, t);
    return `${trail}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="30" fill="#7fd6e6" opacity=".55" filter="url(#blur)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#ffffff"/>`;
  }).join("");
  const rect = shape === "tile" ? '<rect width="512" height="512" rx="112" fill="url(#bg)"/>' : '<rect width="512" height="512" fill="url(#bg)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="AURA">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="72%"><stop offset="0" stop-color="#17394a"/><stop offset=".55" stop-color="#0f2432"/><stop offset="1" stop-color="#0b1620"/></radialGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#7fd6e6" stop-opacity=".55"/><stop offset=".5" stop-color="#7fd6e6" stop-opacity=".16"/><stop offset="1" stop-color="#7fd6e6" stop-opacity="0"/></radialGradient>
    <radialGradient id="core" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#bdeff7"/><stop offset="1" stop-color="#4fb6c9"/></radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6e9f4"/><stop offset="1" stop-color="#5fb8d8"/></linearGradient>
    <filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  ${rect}
  <g transform="translate(256 256) scale(${scale})">
    <circle r="240" fill="url(#halo)"/>
    <g fill="none" stroke="#7fd6e6" stroke-width="15" opacity=".5" filter="url(#glow)">${orbits}</g>
    <g fill="none" stroke="url(#ring)" stroke-width="6" stroke-linecap="round">${orbits}</g>
    <circle r="92" fill="#7fd6e6" opacity=".5" filter="url(#blur)"/>
    <circle r="46" fill="url(#core)"/>
    <ellipse cx="-14" cy="-18" rx="14" ry="9" fill="#ffffff" opacity=".7" transform="rotate(-30 -14 -18)"/>
    ${electrons}
  </g>
</svg>
`;
}

const variants = [
  { file: "icon.svg", svg: svg({ scale: 1, shape: "tile" }) },
  { file: "icon-maskable.svg", svg: svg({ scale: 0.8, shape: "bleed" }) },
];
for (const v of variants) fs.writeFileSync(PUBLIC + v.file, v.svg);
fs.copyFileSync(PUBLIC + "icon.svg", PUBLIC + "aura.svg"); // favicon

const { chromium } = require("playwright");
const png = [
  ["icon.svg", "icon-192.png", 192, true], ["icon.svg", "icon-512.png", 512, true],
  ["icon-maskable.svg", "icon-maskable-192.png", 192, false], ["icon-maskable.svg", "icon-maskable-512.png", 512, false],
  ["icon-maskable.svg", "apple-touch-icon.png", 180, false],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, out, size, transparent] of png) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(PUBLIC + src)).toString("base64")}" width="${size}" height="${size}" style="display:block"></body>`);
  await page.screenshot({ path: PUBLIC + out, omitBackground: transparent });
  console.log("ok", out);
}
await browser.close();
