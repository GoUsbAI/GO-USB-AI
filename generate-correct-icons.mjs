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
    8, 6, 0, 0, 0
  ];
  chunk('IHDR', ihdr);

  const rawData = [];
  const borderRadius = Math.floor(width * 0.2);
  
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const cx1 = borderRadius, cy1 = borderRadius;
      const cx2 = width - borderRadius - 1, cy2 = borderRadius;
      const cx3 = borderRadius, cy3 = height - borderRadius - 1;
      const cx4 = width - borderRadius - 1, cy4 = height - borderRadius - 1;
      
      const inRoundRect = (
        (x >= borderRadius && x < width - borderRadius && y >= borderRadius && y < height - borderRadius) ||
        (x <= borderRadius && y <= borderRadius && Math.pow(x - cx1, 2) + Math.pow(y - cy1, 2) <= Math.pow(borderRadius, 2)) ||
        (x >= width - borderRadius - 1 && y <= borderRadius && Math.pow(x - cx2, 2) + Math.pow(y - cy2, 2) <= Math.pow(borderRadius, 2)) ||
        (x <= borderRadius && y >= height - borderRadius - 1 && Math.pow(x - cx3, 2) + Math.pow(y - cy3, 2) <= Math.pow(borderRadius, 2)) ||
        (x >= width - borderRadius - 1 && y >= height - borderRadius - 1 && Math.pow(x - cx4, 2) + Math.pow(y - cy4, 2) <= Math.pow(borderRadius, 2))
      );

      if (!inRoundRect) {
        rawData.push(255, 255, 255, 0);
      } else {
        const t = y / (height - 1);
        const r = Math.round(64 + (26 - 64) * t);
        const g = Math.round(176 + (136 - 176) * t);
        const b = Math.round(230 + (216 - 230) * t);
        rawData.push(r, g, b, 255);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  chunk('IDAT', [...compressed]);
  chunk('IEND', []);

  return Buffer.from(png);
}

function createIcoFromPng(pngBuffer) {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(0, 6);
  header.writeUInt8(0, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuffer.length, 14);
  header.writeUInt32LE(6 + 16, 18);
  return Buffer.concat([header, pngBuffer]);
}

function main() {
  const png192 = createPNG(192, 192);
  const png512 = createPNG(512, 512);
  const png256 = createPNG(256, 256);

  fs.writeFileSync('packages/go-usb-ai-ui/public/pwa-192.png', png192);
  fs.writeFileSync('packages/go-usb-ai-ui/public/pwa-512.png', png512);
  fs.writeFileSync('apps/desktop/build/icons/icon.png', png512);
  fs.writeFileSync('apps/desktop/build/icons/icon.ico', createIcoFromPng(png256));

  console.log('✅ 生成了正确的正方形图标：');
  console.log('  - packages/go-usb-ai-ui/public/pwa-192.png (192x192)');
  console.log('  - packages/go-usb-ai-ui/public/pwa-512.png (512x512)');
  console.log('  - apps/desktop/build/icons/icon.png (512x512)');
  console.log('  - apps/desktop/build/icons/icon.ico');
}

main();
