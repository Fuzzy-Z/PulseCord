import fs from 'fs';
import zlib from 'zlib';

function createValidPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Discord blurple color: #5865F2 (88, 101, 242)
      rawData[pixelOffset] = 88;     // R
      rawData[pixelOffset + 1] = 101; // G
      rawData[pixelOffset + 2] = 242; // B
      rawData[pixelOffset + 3] = 255; // A
    }
  }

  // IDAT chunk (compressed with zlib deflate)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buffer = Buffer.alloc(8 + len + 4);
  buffer.writeUInt32BE(len, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = calculateCRC(buffer.subarray(4, 8 + len));
  buffer.writeUInt32BE(crc, 8 + len);
  return buffer;
}

function calculateCRC(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const png = createValidPNG(256, 256);
fs.writeFileSync('./public/icon.png', png);
console.log('Valid 256x256 RGBA PNG generated at public/icon.png! Size:', png.length, 'bytes');
