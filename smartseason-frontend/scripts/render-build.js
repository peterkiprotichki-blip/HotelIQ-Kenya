const { execSync } = require('child_process');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');

function run(command) {
  execSync(command, {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
  });
}

run('npm install');
run('npm run build');