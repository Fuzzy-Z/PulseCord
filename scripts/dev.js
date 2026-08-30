import { spawn } from 'child_process';
import http from 'http';

function checkServer(url, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      http.get(url, (res) => {
        clearInterval(interval);
        resolve();
      }).on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(interval);
          reject(new Error('Vite dev server timed out'));
        }
      });
    }, 500);
  });
}

async function main() {
  console.log('🚀 Starting Vite dev server...');
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  const vite = spawn(npmCmd, ['run', 'dev:vite'], { stdio: 'inherit', shell: true });

  await checkServer('http://localhost:5173');
  console.log('⚡ Vite ready! Starting Electron...');

  const electron = spawn(npmCmd, ['exec', 'electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: 'http://localhost:5173' }
  });

  electron.on('close', () => {
    vite.kill();
    process.exit();
  });
}

main().catch(console.error);
