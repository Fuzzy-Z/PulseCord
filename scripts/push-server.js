import { execSync } from 'child_process';

const git = 'C:\\Program Files\\Git\\cmd\\git.exe';
const deployDir = 'C:\\Users\\Kayky\\PulseCord\\deploy-server';

try {
  try {
    execSync(`"${git}" remote remove origin`, { cwd: deployDir, stdio: 'ignore' });
  } catch (e) {}

  execSync(`"${git}" remote add origin https://github.com/Fuzzy-Z/pulsecord-server.git`, { cwd: deployDir });
  console.log('Pushing to https://github.com/Fuzzy-Z/pulsecord-server.git ...');
  const res = execSync(`"${git}" push -u origin main`, { cwd: deployDir, encoding: 'utf8' });
  console.log(res);
  console.log('✅ Push realizado com sucesso para o GitHub!');
} catch (err) {
  console.error('Erro ao dar push (o repositório precisa ser criado no site antes):', err.stdout || err.stderr || err.message);
}
