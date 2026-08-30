import asar from '@electron/asar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const staging = path.join(root, '.staging_app');
const targetAsar = path.join(root, 'dist-electron', 'win-unpacked', 'resources', 'app.asar');

// Clean staging
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

function copyFolder(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

console.log('📦 Preparing staging files...');
copyFolder(path.join(root, 'dist'), path.join(staging, 'dist'));
copyFolder(path.join(root, 'electron'), path.join(staging, 'electron'));
copyFolder(path.join(root, 'server'), path.join(staging, 'server'));
fs.copyFileSync(path.join(root, 'package.json'), path.join(staging, 'package.json'));

console.log('⚡ Packing app.asar...');
await asar.createPackage(staging, targetAsar);

// Clean staging
fs.rmSync(staging, { recursive: true, force: true });
console.log('✅ App packaged successfully at:', targetAsar);
