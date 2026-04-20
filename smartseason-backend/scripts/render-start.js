const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');

execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

execSync('node dist/main.js', {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});