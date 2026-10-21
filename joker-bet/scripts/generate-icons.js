import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(2, 9); // color type 2 (truecolor RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  // Raw image data with filter byte 0 per scanline
  const rowSize = width * 3 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const pxStart = rowStart + 1 + x * 3;
      // Gold/dark gradient feel
      const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
      if (distFromCenter < width * 0.4) {
        rawData[pxStart] = 245; // R (amber)
        rawData[pxStart + 1] = 158; // G
        rawData[pxStart + 2] = 11; // B
      } else {
        rawData[pxStart] = r;
        rawData[pxStart + 1] = g;
        rawData[pxStart + 2] = b;
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  const ihdrChunk = makeChunk('IHDR', ihdr);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate valid PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 11, 14, 23));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 11, 14, 23));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 15, 20, 32));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 245, 158, 11));

console.log('Valid PWA icons generated successfully in public/');
