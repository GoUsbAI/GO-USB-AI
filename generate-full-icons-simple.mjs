#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
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
  const iconSize = Math.floor(width * 0.45);
  const iconX = Math.floor((width - iconSize) / 2);
  const iconY = Math.floor((width - iconSize) / 2.5);

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
        
        const inIcon = x >= iconX && x < iconX + iconSize && y >= iconY && y < iconY + iconSize;
        
        if (inIcon) {
          const ix = (x - iconX) / iconSize;
          const iy = (y - iconY) / iconSize;
          
          const usbShape = drawUsbIcon(ix, iy);
          if (usbShape) {
            rawData.push(208, 208, 208);
            continue;
          }
        }
        
        rawData.push(r, g, b);
      }
    }
  }

  const textYStart = Math.floor(height * 0.65);
  const textSize = Math.floor(width * 0.15);
  const textChars = 'GO-USB-AI';
  const textWidth = textChars.length * textSize * 0.6;
  const textXStart = Math.floor((width - textWidth) / 2);

  for (let y = textYStart; y < textYStart + textSize; y++) {
    if (y >= height) break;
    for (let i = 0; i < textChars.length; i++) {
      const charX = textXStart + Math.floor(i * textSize * 0.6);
      for (let x = charX; x < charX + textSize; x++) {
        if (x >= width) break;
        const inRoundRect = (
          (x >= borderRadius && x < width - borderRadius && y >= borderRadius && y < height - borderRadius) ||
          (x < borderRadius && y < borderRadius && (x * x + y * y < borderRadius * borderRadius)) ||
          (x >= width - borderRadius && y < borderRadius && ((width - x - 1) * (width - x - 1) + y * y < borderRadius * borderRadius)) ||
          (x < borderRadius && y >= height - borderRadius && (x * x + (height - y - 1) * (height - y - 1) < borderRadius * borderRadius)) ||
          (x >= width - borderRadius && y >= height - borderRadius && ((width - x - 1) * (width - x - 1) + (height - y - 1) * (height - y - 1) < borderRadius * borderRadius))
        );
        
        if (inRoundRect) {
          const char = textChars[i];
          const cx = (x - charX) / textSize;
          const cy = (y - textYStart) / textSize;
          
          if (drawChar(char, cx, cy)) {
            rawData[(y * (width * 3 + 1)) + (x * 3) + 1] = 255;
            rawData[(y * (width * 3 + 1)) + (x * 3) + 2] = 255;
            rawData[(y * (width * 3 + 1)) + (x * 3) + 3] = 255;
          }
        }
      }
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  chunk('IDAT', [...compressed]);
  chunk('IEND', []);

  return Buffer.from(png);
}

function drawUsbIcon(x, y) {
  const cx = x * 100;
  const cy = y * 100;
  
  const points = [
    [47.5, 10.4], [37.3, 0.2], [31.1, 5.3], [28.3, 8.1], [27.7, 8.7],
    [3.0, 30.1], [16.6, 43.7], [39.0, 21.2], [38.5, 20.6], [41.3, 17.8],
    [46.4, 12.7], [16.6, 43.7], [4.1, 31.2], [26.0, 9.3], [38.5, 21.7],
    [38.5, 19.5], [28.3, 9.3], [30.6, 7.0], [40.7, 17.2], [41.3, 15.5],
    [37.3, 11.5], [38.5, 10.4], [37.3, 9.3], [36.2, 10.4], [32.3, 6.5],
    [36.8, 1.9], [45.8, 11.0], [35.7, 5.3], [36.8, 4.2], [39.1, 6.5],
    [37.9, 7.6], [40.2, 9.9], [41.3, 8.7], [43.6, 11.0], [42.4, 12.1]
  ];

  const polygons = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [6, 11, 12, 13, 7],
    [8, 14, 15, 16],
    [9, 17, 18, 19, 20, 21, 10],
    [22, 23, 24, 25],
    [26, 27, 28, 29]
  ];

  for (const polygon of polygons) {
    if (isPointInPolygon(cx, cy, polygon.map(i => points[i]))) {
      return true;
    }
  }
  return false;
}

function isPointInPolygon(x, y, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function drawChar(char, x, y) {
  const chars = {
    'G': [[0.1, 0.2], [0.1, 0.8], [0.5, 0.8], [0.5, 0.6], [0.25, 0.6], [0.25, 0.4], [0.5, 0.4], [0.5, 0.2]],
    'O': [[0.15, 0.2], [0.15, 0.8], [0.45, 0.8], [0.45, 0.2]],
    '-': [[0.1, 0.5], [0.4, 0.5]],
    'U': [[0.15, 0.2], [0.15, 0.8], [0.45, 0.8], [0.45, 0.2]],
    'S': [[0.2, 0.2], [0.4, 0.2], [0.4, 0.5], [0.15, 0.5], [0.15, 0.8], [0.4, 0.8]],
    'B': [[0.15, 0.2], [0.15, 0.8], [0.4, 0.2], [0.4, 0.4], [0.2, 0.4], [0.4, 0.6], [0.2, 0.6], [0.4, 0.8]],
    'A': [[0.3, 0.2], [0.1, 0.8], [0.2, 0.8], [0.2, 0.5], [0.4, 0.5], [0.4, 0.8], [0.5, 0.8]],
    'I': [[0.25, 0.2], [0.25, 0.8], [0.35, 0.8], [0.35, 0.2]]
  };
  
  const shape = chars[char];
  if (!shape) return false;
  
  for (let i = 0; i < shape.length - 1; i += 2) {
    const x1 = shape[i][0], y1 = shape[i][1];
    const x2 = shape[i + 1][0], y2 = shape[i + 1][1];
    
    if (isPointInLine(x, y, x1, y1, x2, y2, 0.1)) {
      return true;
    }
  }
  return false;
}

function isPointInLine(px, py, x1, y1, x2, y2, tolerance) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  const t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
  const tClamped = Math.max(0, Math.min(1, t));
  
  const nearestX = x1 + tClamped * dx;
  const nearestY = y1 + tClamped * dy;
  
  const dist = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
  return dist < tolerance;
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
  const sizes = [192, 512];
  
  for (const size of sizes) {
    console.log(`Generating ${size}x${size}...`);
    const png = createPNG(size, size);
    
    const filename = size === 192 
      ? 'packages/go-usb-ai-ui/public/pwa-192.png' 
      : 'packages/go-usb-ai-ui/public/pwa-512.png';
    
    writeFileSync(filename, png);
    console.log(`Generated ${filename}`);
  }
  
  const desktopPng = createPNG(512, 512);
  writeFileSync('apps/desktop/build/icons/icon.png', desktopPng);
  writeFileSync('apps/desktop/build/icons/icon.ico', createIcoFromPng(createPNG(256, 256)));
  console.log('Generated desktop icons');
  
  console.log('✅ All icons generated with full GO-USB-AI logo!');
}

main();
