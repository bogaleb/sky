// Generates Sky's PWA/app icons from raw pixels — zero dependencies.
// Rounded-square sky-blue gradient, white star, small white cloud.
// Usage: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// ---------- CRC32 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Drawing helpers ----------
const lerp = (a, b, t) => a + (b - a) * t;

function inRoundedRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Star polygon points (5-pointed), centered, returned as flat [x,y,...]. */
function starPoints(cx, cy, rOuter, rInner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return pts;
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length / 2 - 1; i < pts.length / 2; j = i++) {
    const xi = pts[i * 2];
    const yi = pts[i * 2 + 1];
    const xj = pts[j * 2];
    const yj = pts[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Sky gradient stops (match kid tokens: #6FCFF5 sky -> #3B9BD6 deep)
const TOP = [111, 207, 245];
const BOTTOM = [46, 130, 200];

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const r = size * 0.225; // corner radius
  // White star: center slightly above middle, a little left.
  const star = starPoints(size * 0.44, size * 0.42, size * 0.24, size * 0.10);
  // Small cloud bottom-right: union of circles.
  const cloudCx = size * 0.68;
  const cloudCy = size * 0.72;
  const cr = size * 0.075;
  const cloudCircles = [
    [cloudCx - 1.6 * cr, cloudCy + 0.5 * cr, 1.0 * cr],
    [cloudCx - 0.5 * cr, cloudCy - 0.2 * cr, 1.5 * cr],
    [cloudCx + 0.8 * cr, cloudCy + 0.1 * cr, 1.1 * cr],
    [cloudCx + 1.7 * cr, cloudCy + 0.6 * cr, 0.8 * cr],
    [cloudCx, cloudCy + 0.8 * cr, 1.3 * cr],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!inRoundedRect(x + 0.5, y + 0.5, size, size, r)) {
        rgba[i + 3] = 0; // transparent corners
        continue;
      }
      const t = y / (size - 1);
      let pr = lerp(TOP[0], BOTTOM[0], t);
      let pg = lerp(TOP[1], BOTTOM[1], t);
      let pb = lerp(TOP[2], BOTTOM[2], t);
      // Soft radial highlight behind the star for depth.
      const dxh = x - size * 0.44;
      const dyh = y - size * 0.42;
      const dh = Math.sqrt(dxh * dxh + dyh * dyh) / (size * 0.4);
      if (dh < 1) {
        const glow = (1 - dh) * 28;
        pr += glow; pg += glow; pb += glow;
      }
      const isStar = pointInPolygon(x + 0.5, y + 0.5, star);
      let isCloud = false;
      for (const [ccx, ccy, ccr] of cloudCircles) {
        if (inCircle(x + 0.5, y + 0.5, ccx, ccy, ccr)) { isCloud = true; break; }
      }
      if (isStar || isCloud) {
        // White with a hint of the local gradient so edges anti-alias softly.
        pr = 255; pg = 255; pb = 255;
      }
      rgba[i] = Math.min(255, Math.round(pr));
      rgba[i + 1] = Math.min(255, Math.round(pg));
      rgba[i + 2] = Math.min(255, Math.round(pb));
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of targets) {
  const png = encodePNG(size, size, drawIcon(size));
  writeFileSync(join(outDir, name), png);
  console.log(`wrote public/icons/${name} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
