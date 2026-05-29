import fs from 'fs';
import { deflateSync } from 'zlib';

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height) {
  const png = [];
  png.push(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);

  function chunk(type, data) {
    const length = [data.length >>> 24, (data.length >>> 16) & 0xFF, (data.length >>> 8) & 0xFF, data.length & 0xFF];
    const typeData = [...type.split('').map(c => c.charCodeAt(0)), ...data];
    const crc = crc32(typeData);
    const crcBytes = [crc >>> 24, (crc >>> 16) & 0xFF, (crc >>> 8) & 0xFF, crc & 0xFF];
    png.push(...length, ...typeData, ...crcBytes);
  }

  const ihdr = [
    (width >>> 24) & 0xFF, (width >>> 16) & 0xFF, (width >>> 8) & 0xFF, width & 0xFF,
    (height >>> 24) & 0xFF, (height >>> 16) & 0xFF, (height >>> 8) & 0xFF, height & 0xFF,
    8, 2, 0, 0, 0
  ];
  chunk('IHDR', ihdr);

  const rawData = [];
  const borderRadius = Math.floor(width * 0.2);
  
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const inRoundRect = (
        (x >= borderRadius && x < width - borderRadius && y >= borderRadius && y < height - borderRadius) ||
        (x < borderRadius && y < borderRadius && (x * x + y * y < borderRadius * borderRadius)) ||
        (x >= width - borderRadius && y < borderRadius && ((width - x - 1) * (width - x - 1) + y * y < borderRadius * borderRadius)) ||
        (x < borderRadius && y >= height - borderRadius && (x * x + (height - y - 1) * (height - y - 1) < borderRadius * borderRadius)) ||
        (x >= width - borderRadius && y >= height - borderRadius && ((width - x - 1) * (width - x - 1) + (height - y - 1) * (height - y - 1) < borderRadius * borderRadius))
      );

      if (!inRoundRect) {
        rawData.push(255, 255, 255);
      } else {
        const t = y / (height - 1);
        const r = Math.round(64 + (26 - 64) * t);
        const g = Math.round(176 + (136 - 176) * t);
        const b = Math.round(230 + (216 - 230) * t);
        rawData.push(r, g, b);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  chunk('IDAT', [...compressed]);
  chunk('IEND', []);

  return Buffer.from(png);
}

const blue192 = createPNG(192, 192);
const blue512 = createPNG(512, 512);

fs.writeFileSync('packages/go-usb-ai-ui/public/pwa-192.png', blue192);
fs.writeFileSync('packages/go-usb-ai-ui/public/pwa-512.png', blue512);

console.log('Generated PNG icons!');
