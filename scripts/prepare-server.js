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

console.log(`\n🚀 [Prepare Server] Bumping version from v${oldVersion} -> v${newVersion}...\n`);

// 2. Build Vite bundle
console.log('⚡ Running vite build...');
execSync('npx vite build', { cwd: root, stdio: 'inherit' });

// 3. Staging and Packaging app.asar
console.log('📦 Staging files for app.asar...');
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

function copyFolder(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

copyFolder(path.join(root, 'dist'), path.join(staging, 'dist'));
copyFolder(path.join(root, 'electron'), path.join(staging, 'electron'));
copyFolder(path.join(root, 'server'), path.join(staging, 'server'));
fs.copyFileSync(path.join(root, 'package.json'), path.join(staging, 'package.json'));

console.log('⚡ Creating app.asar...');
const generatedAsar = path.join(root, 'app.asar');
await asar.createPackage(staging, generatedAsar);

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
  notes: `Atualização v${newVersion} com melhorias no Voxel.`,
  hasAsar: true
};

const versionJsonStr = JSON.stringify(versionManifest, null, 2);

// Copy to deploy-server and server
fs.writeFileSync(path.join(deployDir, 'version.json'), versionJsonStr);
fs.copyFileSync(generatedAsar, path.join(deployDir, 'app.asar'));
if (fs.existsSync(path.join(serverDir, 'index.js'))) fs.copyFileSync(path.join(serverDir, 'index.js'), path.join(deployDir, 'index.js'));
if (fs.existsSync(path.join(serverDir, 'signaling.js'))) fs.copyFileSync(path.join(serverDir, 'signaling.js'), path.join(deployDir, 'signaling.js'));
if (fs.existsSync(path.join(serverDir, 'storage.js'))) fs.copyFileSync(path.join(serverDir, 'storage.js'), path.join(deployDir, 'storage.js'));
if (fs.existsSync(path.join(serverDir, 'musicService.js'))) fs.copyFileSync(path.join(serverDir, 'musicService.js'), path.join(deployDir, 'musicService.js'));

// Also copy web dist to deploy-server/dist
copyFolder(path.join(root, 'dist'), path.join(deployDir, 'dist'));

fs.writeFileSync(path.join(serverDir, 'version.json'), versionJsonStr);
fs.copyFileSync(generatedAsar, path.join(serverDir, 'app.asar'));

// Cleanup root generated asar
try { fs.unlinkSync(generatedAsar); } catch (e) {}

console.log('🌐 Committing changes to deploy-server repository (no push)...');
try {
  execSync(`"${git}" add -A`, { cwd: deployDir, stdio: 'inherit' });
  execSync(`"${git}" commit -m "Prepare Server & OTA Update v${newVersion}"`, { cwd: deployDir, stdio: 'inherit' });
  console.log('✅ deploy-server committed successfully!');
} catch (err) {
  console.warn('⚠️ deploy-server commit info:', err.message);
}

console.log('🌐 Committing changes to main repository (no push)...');
try {
  execSync(`"${git}" add -A`, { cwd: root, stdio: 'inherit' });
  execSync(`"${git}" commit -m "chore: prepare server and OTA update v${newVersion}"`, { cwd: root, stdio: 'inherit' });
  console.log('✅ Main app repo committed successfully!');
} catch (err) {
  console.warn('⚠️ Main repo commit info:', err.message);
}

console.log(`\n🎉 Pronto para o servidor! v${newVersion} preparado e commitado (sem push).\n`);
