import asar from '@electron/asar';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const deployDir = path.join(root, 'deploy-server');
const serverDir = path.join(root, 'server');
const staging = path.join(root, '.staging_app');
const targetAsar = path.join(root, 'dist-electron', 'win-unpacked', 'resources', 'app.asar');
const git = 'C:\\Program Files\\Git\\cmd\\git.exe';

// 1. Bump version
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version || '1.0.0';
const vParts = oldVersion.split('.').map(n => parseInt(n, 10) || 0);
vParts[2] = (vParts[2] || 0) + 1;
const newVersion = process.argv[2] || `${vParts[0]}.${vParts[1]}.${vParts[2]}`;
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log(`\n🚀 [PulseCord Publisher] Bumping version from v${oldVersion} -> v${newVersion}...\n`);

// 2. Build Vite bundle
console.log('⚡ Running vite build...');
execSync('npx vite build', { cwd: root, stdio: 'inherit' });

// 3. Staging and Packaging app.asar
console.log('📦 Staging files for app.asar...');
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

function copyFolder(src, dest, filterFn) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, {
    recursive: true,
    filter: filterFn || (() => true)
  });
}

// Copy dist, electron, public and server (excluding any nested .asar files!)
copyFolder(path.join(root, 'dist'), path.join(staging, 'dist'));
copyFolder(path.join(root, 'electron'), path.join(staging, 'electron'));
copyFolder(path.join(root, 'public'), path.join(staging, 'public'));
copyFolder(path.join(root, 'server'), path.join(staging, 'server'), (src) => !src.endsWith('.asar'));
fs.copyFileSync(path.join(root, 'package.json'), path.join(staging, 'package.json'));

console.log('⚡ Creating app.asar...');
const generatedAsar = path.join(root, 'app.asar');
await asar.createPackage(staging, generatedAsar);

const asarSizeMb = (fs.statSync(generatedAsar).size / (1024 * 1024)).toFixed(2);
console.log(`📦 Generated clean app.asar package: ${asarSizeMb} MB`);

// Clean staging
fs.rmSync(staging, { recursive: true, force: true });

// Copy to dist-electron/win-unpacked if it exists
if (fs.existsSync(path.dirname(targetAsar))) {
  fs.copyFileSync(generatedAsar, targetAsar);
}

// 4. Create version.json manifest
const versionManifest = {
  version: newVersion,
  releaseDate: new Date().toISOString(),
  notes: `Atualização v${newVersion} com melhorias de voz e estabilidade no Voxel.`,
  hasAsar: true
};

const versionJsonStr = JSON.stringify(versionManifest, null, 2);

// Copy all backend server files, asar, version.json & dist to deploy-server
fs.writeFileSync(path.join(deployDir, 'version.json'), versionJsonStr);
fs.copyFileSync(generatedAsar, path.join(deployDir, 'app.asar'));
if (fs.existsSync(path.join(serverDir, 'index.js'))) fs.copyFileSync(path.join(serverDir, 'index.js'), path.join(deployDir, 'index.js'));
if (fs.existsSync(path.join(serverDir, 'signaling.js'))) fs.copyFileSync(path.join(serverDir, 'signaling.js'), path.join(deployDir, 'signaling.js'));
if (fs.existsSync(path.join(serverDir, 'storage.js'))) fs.copyFileSync(path.join(serverDir, 'storage.js'), path.join(deployDir, 'storage.js'));
if (fs.existsSync(path.join(serverDir, 'musicService.js'))) fs.copyFileSync(path.join(serverDir, 'musicService.js'), path.join(deployDir, 'musicService.js'));

// Also copy web dist to deploy-server/dist
copyFolder(path.join(root, 'dist'), path.join(deployDir, 'dist'));

fs.writeFileSync(path.join(serverDir, 'version.json'), versionJsonStr);

// Cleanup root generated asar
try { fs.unlinkSync(generatedAsar); } catch (e) {}

// Delete old oversized server/app.asar from root repo to prevent git push errors
try {
  if (fs.existsSync(path.join(serverDir, 'app.asar'))) {
    fs.unlinkSync(path.join(serverDir, 'app.asar'));
  }
} catch (e) {}

console.log('🌐 Committing and pushing OTA update to GitHub (Render will deploy in ~1 min)...');

try {
  execSync(`"${git}" add -A`, { cwd: deployDir, stdio: 'inherit' });
  execSync(`"${git}" commit -m "Publish OTA Update v${newVersion}"`, { cwd: deployDir, stdio: 'inherit' });
  execSync(`"${git}" push origin main`, { cwd: deployDir, stdio: 'inherit' });
  console.log('✅ Server repository updated with new app.asar and server code!');
} catch (err) {
  console.warn('⚠️ Server git push warning:', err.message);
}

try {
  execSync(`"${git}" add .`, { cwd: root, stdio: 'inherit' });
  execSync(`"${git}" commit -m "Publish OTA Update v${newVersion}"`, { cwd: root, stdio: 'inherit' });
  execSync(`"${git}" push origin main`, { cwd: root, stdio: 'inherit' });
  console.log('✅ Main app repository updated!');
} catch (err) {
  console.warn('⚠️ Main repo git push warning:', err.message);
}

console.log(`\n======================================================`);
console.log(`🎉 Atualização v${newVersion} (${asarSizeMb} MB) publicada com sucesso!`);
console.log(`Assim que seus amigos abrirem o Voxel, o aplicativo`);
console.log(`vai detectar e baixar o pacote automaticamente!`);
console.log(`======================================================\n`);
