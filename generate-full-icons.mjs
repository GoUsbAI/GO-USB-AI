#!/usr/bin/env node
import fs from 'fs';
import { createCanvas, registerFont } from 'canvas';

function drawLogo(canvas, size) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  
  const borderRadius = size * 0.2;
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#40B0E6');
  gradient.addColorStop(1, '#1A8CD8');
  
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, borderRadius);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  const iconSize = size * 0.5;
  const iconOffset = (size - iconSize) / 2;
  
  ctx.save();
  ctx.translate(iconOffset, iconOffset);
  ctx.scale(iconSize / 476, iconSize / 476);
  
  ctx.fillStyle = '#d0d0d0';
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(475.308, 104.166);
  ctx.lineTo(373.484, 2.342);
  ctx.lineTo(311.26, 53.254);
  ctx.lineTo(282.972, 81.534);
  ctx.lineTo(277.316, 87.19);
  ctx.lineTo(29.788, 300.798);
  ctx.lineTo(165.556, 436.55);
  ctx.lineTo(390.452, 211.648);
  ctx.lineTo(384.796, 206);
  ctx.lineTo(413.084, 177.712);
  ctx.lineTo(464, 126.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(165.556, 436.55);
  ctx.lineTo(41.098, 312.092);
  ctx.lineTo(260.348, 92.846);
  ctx.lineTo(384.796, 217.3);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(384.796, 194.67);
  ctx.lineTo(282.98, 92.846);
  ctx.lineTo(305.596, 70.222);
  ctx.lineTo(407.428, 172.046);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(413.084, 155.078);
  ctx.lineTo(373.484, 115.478);
  ctx.lineTo(384.796, 104.166);
  ctx.lineTo(373.484, 92.846);
  ctx.lineTo(362.172, 104.158);
  ctx.lineTo(322.572, 64.558);
  ctx.lineTo(367.828, 19.302);
  ctx.lineTo(458.332, 109.81);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(356.514, 53.249);
  ctx.lineTo(367.829, 41.936);
  ctx.lineTo(390.455, 64.565);
  ctx.lineTo(379.14, 75.878);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(401.772, 98.511);
  ctx.lineTo(413.087, 87.198);
  ctx.lineTo(435.713, 109.827);
  ctx.lineTo(424.398, 121.14);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.18}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GO-USB-AI', size / 2, size * 0.6);
}

async function main() {
  const sizes = [192, 512, 256];
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    drawLogo(canvas, size);
    
    const buffer = canvas.toBuffer('image/png');
    let filename;
    
    if (size === 192) {
      filename = 'packages/go-usb-ai-ui/public/pwa-192.png';
    } else if (size === 512) {
      filename = 'packages/go-usb-ai-ui/public/pwa-512.png';
    } else {
      filename = 'apps/desktop/build/icons/icon.png';
    }
    
    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename} (${size}x${size})`);
  }
  
  console.log('✅ All icons generated!');
}

main().catch(console.error);
