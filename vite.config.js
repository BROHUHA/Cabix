import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to calculate CRC32 for PNG chunks
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Generate rich espresso themed PNG icon
function generateCoffeeIconPng(size) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw pixel rows with filter byte 0
  const rowLength = 1 + size * 4;
  const rawData = Buffer.alloc(rowLength * size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Deep obsidian espresso gradient to warm amber crema
        const t = dist / radius;
        const r = Math.round(42 * (1 - t * 0.6) + 14 * t);
        const g = Math.round(18 * (1 - t * 0.5) + 6 * t);
        const b = Math.round(8 * (1 - t * 0.5) + 3 * t);
        
        // Inner golden crema coffee cup motif
        const innerDist = Math.sqrt(dx * dx + (dy + size * 0.05) * (dy + size * 0.05));
        if (innerDist < size * 0.22) {
          // Crema gold
          rawData[pxOffset] = 230;     // R
          rawData[pxOffset + 1] = 145; // G
          rawData[pxOffset + 2] = 35;  // B
          rawData[pxOffset + 3] = 255; // A
        } else if (dist > radius - 3) {
          // Subtle golden rim
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 194;
          rawData[pxOffset + 2] = 133;
          rawData[pxOffset + 3] = 240;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent outside circular mask
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function ensurePngIcons() {
  const iconDir = path.resolve(process.cwd(), 'public/assets/icons');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  const p192 = path.join(iconDir, 'icon-192.png');
  const p512 = path.join(iconDir, 'icon-512.png');

  fs.writeFileSync(p192, generateCoffeeIconPng(192));
  fs.writeFileSync(p512, generateCoffeeIconPng(512));
  console.log('[PWA] Generated icon-192.png and icon-512.png successfully!');
}

ensurePngIcons();

export default defineConfig({
  server: {
    host: true,
    port: 5173
  }
});
