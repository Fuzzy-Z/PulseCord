const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const iconPngPath = path.join(__dirname, '../public/icon.png');
  const img = nativeImage.createFromPath(iconPngPath);

  // Generate different resolutions for Windows ICO
  const sizes = [256, 128, 64, 48, 32, 16];
  const images = [];

  for (const size of sizes) {
    const resized = img.resize({ width: size, height: size, quality: 'high' });
    images.push({
      size,
      buffer: resized.toPNG()
    });
  }

  // Build ICO file binary format (PNG-encoded ICO supported on Windows Vista/7/8/10/11)
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let currentOffset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  const imageBuffers = [];

  for (const item of images) {
    const entry = Buffer.alloc(dirEntrySize);
    const w = item.size >= 256 ? 0 : item.size;
    const h = item.size >= 256 ? 0 : item.size;

    entry.writeUInt8(w, 0); // Width
    entry.writeUInt8(h, 1); // Height
    entry.writeUInt8(0, 2); // Palette colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Image size
    entry.writeUInt32LE(currentOffset, 12); // Image offset

    entries.push(entry);
    imageBuffers.push(item.buffer);
    currentOffset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);

  const outIco = path.join(__dirname, '../public/icon.ico');
  const outBuildIco = path.join(__dirname, '../public/favicon.ico');
  fs.writeFileSync(outIco, icoBuffer);
  fs.writeFileSync(outBuildIco, icoBuffer);

  // Also create build directory if needed
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), fs.readFileSync(iconPngPath));

  console.log('Successfully generated Windows ICO files at public/icon.ico and build/icon.ico (' + icoBuffer.length + ' bytes)');

  app.quit();
});
