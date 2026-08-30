import { execSync } from 'child_process';

const gh = 'C:\\Program Files\\GitHub CLI\\gh.exe';

try {
  const out = execSync(`"${gh}" auth status`, { encoding: 'utf8' });
  console.log('AUTH STATUS:\n', out);
} catch (err) {
  console.log('NOT LOGGED IN OR ERROR:\n', err.stdout || err.stderr || err.message);
}
