const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

execSync('node dist/main.js', {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});