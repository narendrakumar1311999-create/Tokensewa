import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const PUBLIC_DIR = path.resolve('public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function createPng(width, height, drawPixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines
  const rawScanlines = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rawScanlines.push(row);
  }

  const rawData = Buffer.concat(rawScanlines);
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand Indigo gradient with stylish queue / ticket badge
function drawIconPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const rCorner = w * (isMaskable ? 0 : 0.22); // rounded corner for normal icon, full bleed for maskable
  
  // Background: Rich Indigo to Deep Purple gradient
  const t = (x + y) / (w + h);
  let bgR = Math.round(79 * (1 - t) + 49 * t);   // 4f46e5 to 312e81
  let bgG = Math.round(70 * (1 - t) + 46 * t);
  let bgB = Math.round(229 * (1 - t) + 129 * t);

  // Rounded rectangle bounds for non-maskable
  if (!isMaskable) {
    const rx = Math.max(Math.abs(x - cx) - (cx - rCorner), 0);
    const ry = Math.max(Math.abs(y - cy) - (cy - rCorner), 0);
    if (Math.hypot(rx, ry) > rCorner) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Draw central ticket / token emblem inside safe area (40% to 60%)
  const scale = w / 100;
  // Center token card: x: 26 to 74, y: 22 to 78
  const cardLeft = 24 * scale;
  const cardRight = 76 * scale;
  const cardTop = 22 * scale;
  const cardBottom = 78 * scale;
  const cardR = 8 * scale;

  if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
    // Check ticket cutout notches on left and right center
    const notchY = 50 * scale;
    const notchR = 7 * scale;
    const distNotchL = Math.hypot(x - cardLeft, y - notchY);
    const distNotchR = Math.hypot(x - cardRight, y - notchY);

    if (distNotchL < notchR || distNotchR < notchR) {
      // Cutout notch shows background
      return [bgR, bgG, bgB, 255];
    }

    // Ticket inner card background (Crisp White with slight warmth)
    let cardPixelR = 255;
    let cardPixelG = 255;
    let cardPixelB = 255;

    // Draw ticket header (emerald / cyan accent on top)
    if (y < 36 * scale) {
      return [16, 185, 129, 255]; // emerald-500
    }

    // Dashed divider line at y = 50
    if (Math.abs(y - 50 * scale) < 1.2 * scale && (Math.floor(x / (4 * scale)) % 2 === 0)) {
      return [203, 213, 225, 255]; // slate-300 dash
    }

    // Number '1' or Clock icon symbol in bottom section
    // Let's draw a clock symbol at center bottom (cx, 64 * scale)
    const clockCx = 50 * scale;
    const clockCy = 64 * scale;
    const clockR = 9 * scale;
    const dClock = Math.hypot(x - clockCx, y - clockCy);

    if (Math.abs(dClock - clockR) < 1.5 * scale) {
      return [79, 70, 229, 255]; // Indigo rim
    }
    // Clock hands
    if (Math.abs(x - clockCx) < 1.2 * scale && y >= clockCy - clockR + 2 * scale && y <= clockCy) {
      return [79, 70, 229, 255]; // 12 o'clock hand
    }
    if (Math.abs(y - clockCy) < 1.2 * scale && x >= clockCx && x <= clockCx + clockR - 2 * scale) {
      return [79, 70, 229, 255]; // 3 o'clock hand
    }

    return [cardPixelR, cardPixelG, cardPixelB, 255];
  }

  return [bgR, bgG, bgB, 255];
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <g filter="url(#shadow)">
    <!-- Ticket Body -->
    <path d="M 130 110 
             H 382 
             A 28 28 0 0 1 410 138 
             V 226 
             A 30 30 0 0 0 410 286 
             V 374 
             A 28 28 0 0 1 382 402 
             H 130 
             A 28 28 0 0 1 102 374 
             V 286 
             A 30 30 0 0 0 102 226 
             V 138 
             A 28 28 0 0 1 130 110 Z" 
          fill="#ffffff"/>
          
    <!-- Ticket Header Badge -->
    <path d="M 130 110 H 382 A 28 28 0 0 1 410 138 V 180 H 102 V 138 A 28 28 0 0 1 130 110 Z" fill="#10b981"/>
    
    <!-- Token Header Text / Stars -->
    <circle cx="150" cy="145" r="8" fill="#ffffff" opacity="0.8"/>
    <circle cx="362" cy="145" r="8" fill="#ffffff" opacity="0.8"/>
    
    <!-- Perforation line -->
    <line x1="120" y1="256" x2="392" y2="256" stroke="#cbd5e1" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>
    
    <!-- Clock / Countdown Icon in bottom section -->
    <circle cx="256" cy="330" r="42" fill="none" stroke="#4f46e5" stroke-width="8"/>
    <polyline points="256,306 256,330 280,330" fill="none" stroke="#4f46e5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="256" cy="330" r="5" fill="#4f46e5"/>
    
    <!-- Bell icon badge in top section -->
    <path d="M 256 128 C 248 128 244 134 244 142 V 154 C 238 156 234 162 234 168 H 278 C 278 162 274 156 268 154 V 142 C 268 134 264 128 256 128 Z" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgContent);
console.log('Created public/icon.svg');

// Generate PNGs
console.log('Generating 192x192 PNG...');
const png192 = createPng(192, 192, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.png'), png192);

console.log('Generating 512x512 PNG...');
const png512 = createPng(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.png'), png512);

console.log('Generating 512x512 Maskable PNG...');
const pngMaskable512 = createPng(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), pngMaskable512);

console.log('Generating 180x180 Apple Touch Icon...');
const pngApple180 = createPng(180, 180, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), pngApple180);

// Favicon 32x32
const favicon32 = createPng(32, 32, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), favicon32);

console.log('All PWA icons successfully generated!');
