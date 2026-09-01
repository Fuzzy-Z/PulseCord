const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

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

  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body, html { margin: 0; padding: 0; width: 512px; height: 512px; overflow: hidden; background: transparent; }
          img { width: 512px; height: 512px; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${dataUri}" />
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
  
  // Wait 500ms for SVG render
  await new Promise((r) => setTimeout(r, 500));

  const image = await win.webContents.capturePage();
  const pngBuffer = image.toPNG();

  const outPng = path.join(__dirname, '../public/icon.png');
  fs.writeFileSync(outPng, pngBuffer);
  console.log('Saved high-res PNG icon to:', outPng, `(${pngBuffer.length} bytes)`);

  app.quit();
});
