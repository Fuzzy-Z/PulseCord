import { execSync } from 'child_process';
import path from 'path';

const gitExe = 'C:\\Program Files\\Git\\cmd\\git.exe';

function runGit(args, cwd) {
  try {
    const cmd = `"${gitExe}" ${args}`;
    console.log(`[Executing in ${cwd}] ${cmd}`);
    const output = execSync(cmd, { cwd, encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (err) {
    console.error(`Error running git:`, err.stdout || err.stderr || err.message);
    throw err;
  }
}

const deployServerDir = 'C:\\Users\\Kayky\\PulseCord\\deploy-server';
const rootDir = 'C:\\Users\\Kayky\\PulseCord';

console.log('=== 1. Configuring Global & Local Git ===');
runGit('config --global user.name "Fuzzy-Z"', rootDir);
runGit('config --global user.email "kaykygithub24@gmail.com"', rootDir);
runGit('config --global init.defaultBranch main', rootDir);

console.log('=== 2. Initializing Git in deploy-server (Ready for Render/GitHub) ===');
try {
  runGit('init', deployServerDir);
} catch (e) {}

runGit('config user.name "Fuzzy-Z"', deployServerDir);
runGit('config user.email "kaykygithub24@gmail.com"', deployServerDir);
runGit('add .', deployServerDir);

try {
  runGit('commit -m "Initial commit: PulseCord WebRTC and Signaling Server"', deployServerDir);
} catch (e) {
  console.log('Commit already created or no changes');
}

runGit('branch -M main', deployServerDir);
runGit('status', deployServerDir);

console.log('=== 3. Initializing Git in PulseCord root repository ===');
try {
  runGit('init', rootDir);
} catch (e) {}

runGit('config user.name "Fuzzy-Z"', rootDir);
runGit('config user.email "kaykygithub24@gmail.com"', rootDir);
runGit('add .', rootDir);

try {
  runGit('commit -m "Initial commit: PulseCord Discord clone Desktop App and Server"', rootDir);
} catch (e) {
  console.log('Commit already created or no changes');
}

runGit('branch -M main', rootDir);
console.log('✅ Git setup and initial commits completed successfully!');
