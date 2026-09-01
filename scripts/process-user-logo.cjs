const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const userLogoPath = 'C:\\Users\\Kayky\\.gemini\\antigravity-ide\\brain\\7d59f35d-2d58-4aa6-9d24-8f558c6cb65d\\.user_uploaded\\media_1788258869319.png';

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true
    }
  });

  const imageBuffer = fs.readFileSync(userLogoPath);
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 512px; height: 512px; overflow: hidden; background: transparent; }
          canvas { width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        <canvas id="c" width="512" height="512"></canvas>
        <script>
          const img = new Image();
          img.onload = () => {
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            
            // First draw image on temporary canvas to find bounds & remove white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);

            const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;

            // Make white / near-white background transparent
            let minX = img.width, minY = img.height, maxX = 0, maxY = 0;

            for (let y = 0; y < img.height; y++) {
              for (let x = 0; x < img.width; x++) {
                const idx = (y * img.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // If pixel is near white background (r > 240, g > 240, b > 240)
                if (r > 240 && g > 240 && b > 240) {
                  data[idx + 3] = 0; // Transparent
                } else if (data[idx + 3] > 20) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            tempCtx.putImageData(imgData, 0, 0);

            // Bounding box of the logo
            const cropW = Math.max(10, maxX - minX);
            const cropH = Math.max(10, maxY - minY);
            
            // Tightly fill 512x512 canvas with ~32px padding
            const targetSize = 448;
            const scale = Math.min(targetSize / cropW, targetSize / cropH);
            const drawW = cropW * scale;
            const drawH = cropH * scale;
            const drawX = (512 - drawW) / 2;
            const drawY = (512 - drawH) / 2;

            ctx.clearRect(0, 0, 512, 512);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(tempCanvas, minX, minY, cropW, cropH, drawX, drawY, drawW, drawH);
            window.__done = true;
          };
          img.src = "${dataUri}";
        </script>
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);

  // Wait for canvas processing
  for (let i = 0; i < 30; i++) {
    const done = await win.webContents.executeJavaScript('window.__done');
    if (done) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  await new Promise((r) => setTimeout(r, 200));

  const image = await win.webContents.capturePage();
  const pngBuffer = image.toPNG();

  const outPng = path.join(__dirname, '../public/icon.png');
  const outLogo = path.join(__dirname, '../public/logo.png');
  fs.writeFileSync(outPng, pngBuffer);
  fs.writeFileSync(outLogo, pngBuffer);
  console.log('Saved tightly cropped user logo to public/icon.png and public/logo.png:', pngBuffer.length, 'bytes');

  app.quit();
});
