const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;

// Read App Version
let appVersion = '1.0.2';
try {
  const pkgPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    appVersion = pkg.version || '1.0.2';
  }
} catch (e) {}

// Start embedded signaling server if not already running
async function ensureSignalingServer() {
  try {
    const { startServer } = await import('../server/index.js');
    await startServer(4000);
    console.log('[Electron] Embedded signaling server started on port 4000');
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log('[Electron] Signaling server already running on port 4000');
    } else {
      console.error('[Electron] Error starting signaling server:', err);
    }
  }
}

// Version Comparison Helper (e.g. 1.0.1 > 1.0.0)
function isNewerVersion(remote, current) {
  if (!remote || !current) return false;
  const parse = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [r1 = 0, r2 = 0, r3 = 0] = parse(remote);
  const [c1 = 0, c2 = 0, c3 = 0] = parse(current);
  if (r1 > c1) return true;
  if (r1 === c1 && r2 > c2) return true;
  if (r1 === c1 && r2 === c2 && r3 > c3) return true;
  return false;
}

// Check for updates
function checkForUpdates(serverUrl = 'https://pulsecord-1-w3xw.onrender.com') {
  return new Promise((resolve) => {
    try {
      const cleanUrl = (serverUrl || 'https://pulsecord-1-w3xw.onrender.com').replace(/\/$/, '');
      const apiUrl = `${cleanUrl}/api/version`;
      const client = apiUrl.startsWith('https') ? https : http;

      const req = client.get(apiUrl, { timeout: 10000 }, (res) => {
        if (res.statusCode !== 200) {
          return resolve({ hasUpdate: false, currentVersion: appVersion, error: `Status ${res.statusCode}` });
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const remoteInfo = JSON.parse(data);
            const remoteVersion = remoteInfo.version;
            const hasUpdate = isNewerVersion(remoteVersion, appVersion) && remoteInfo.hasAsar !== false;
            resolve({
              hasUpdate,
              currentVersion: appVersion,
              remoteVersion,
              notes: remoteInfo.notes,
              releaseDate: remoteInfo.releaseDate,
              asarUrl: `${cleanUrl}/api/update/app.asar`
            });
          } catch (err) {
            resolve({ hasUpdate: false, currentVersion: appVersion, error: err.message });
          }
        });
      });

      req.on('error', (err) => resolve({ hasUpdate: false, currentVersion: appVersion, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ hasUpdate: false, currentVersion: appVersion, error: 'Timeout ao verificar atualizações.' });
      });
    } catch (e) {
      resolve({ hasUpdate: false, currentVersion: appVersion, error: e.message });
    }
  });
}

// Download .asar update package
function downloadUpdate(asarUrl) {
  return new Promise((resolve, reject) => {
    try {
      const resourcesDir = process.resourcesPath || path.join(__dirname, '..');
      const tempAsar = path.join(resourcesDir, 'app.asar.new');
      const client = asarUrl.startsWith('https') ? https : http;

      const file = fs.createWriteStream(tempAsar);
      const req = client.get(asarUrl, { timeout: 45000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadUpdate(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Falha no download (Status ${res.statusCode})`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0 && mainWindow) {
            const percent = Math.round((downloadedBytes / totalBytes) * 100);
            mainWindow.webContents.send('update-download-progress', { percent, downloadedBytes, totalBytes });
          }
        });

        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log('[Updater] Package downloaded to:', tempAsar);
            resolve({ success: true, path: tempAsar });
          });
        });
      });

      req.on('error', (err) => {
        try { fs.unlinkSync(tempAsar); } catch (e) {}
        reject(err);
      });
      req.on('timeout', () => {
        req.destroy();
        try { fs.unlinkSync(tempAsar); } catch (e) {}
        reject(new Error('Tempo limite excedido ao baixar atualização.'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Apply update and restart PulseCord
function applyUpdateAndRestart() {
  if (!app.isPackaged) {
    console.log('[Updater] Dev mode: relaunching...');
    app.relaunch();
    app.exit(0);
    return;
  }

  const resourcesDir = process.resourcesPath;
  const targetAsar = path.join(resourcesDir, 'app.asar');
  const newAsar = path.join(resourcesDir, 'app.asar.new');
  const exePath = app.getPath('exe');

  if (!fs.existsSync(newAsar)) {
    console.warn('[Updater] app.asar.new not found.');
    return;
  }

  if (process.platform === 'win32') {
    const updaterBat = path.join(app.getPath('temp'), `pulsecord-update-${Date.now()}.bat`);
    const batContent = `@echo off
timeout /t 1 /nobreak > nul
move /y "${newAsar}" "${targetAsar}"
start "" "${exePath}"
del "%~f0"
exit
`;
    fs.writeFileSync(updaterBat, batContent, 'utf-8');
    const child = spawn('cmd.exe', ['/c', updaterBat], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    app.exit(0);
  } else {
    try {
      fs.copyFileSync(newAsar, targetAsar);
      fs.unlinkSync(newAsar);
    } catch (e) {}
    app.relaunch();
    app.exit(0);
  }
}

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.cjs'))
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    backgroundColor: '#090a0f',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Handle maximized state updates
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized-change', false);
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = 'http://localhost:5173';

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Automatic Background Update Check 3 seconds after window launch
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const updateInfo = await checkForUpdates();
        if (updateInfo.hasUpdate && mainWindow) {
          mainWindow.webContents.send('update-available', updateInfo);
        }
      } catch (e) {}
    }, 3000);
  });
}

// IPC Window Controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// IPC Auto-Updater Handlers
ipcMain.handle('get-app-version', () => appVersion);

ipcMain.handle('check-for-updates', async (event, serverUrl) => {
  return await checkForUpdates(serverUrl);
});

ipcMain.handle('download-update', async (event, asarUrl) => {
  return await downloadUpdate(asarUrl);
});

ipcMain.on('apply-update', () => {
  applyUpdateAndRestart();
});

// IPC Desktop Screen Capturer (Exact Discord Screen / Window picker)
ipcMain.handle('get-desktop-sources', async (event, opts) => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 360, height: 200 },
    fetchWindowIcons: true
  });

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
    display_id: source.display_id
  }));
});

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  await ensureSignalingServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
