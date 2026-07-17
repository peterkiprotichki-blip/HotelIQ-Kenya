const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
const tsconfigPath = path.join(backendDir, 'tsconfig.json');

function run(command) {
  execSync(command, {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  });
}

run('npm install');
run(`npx prisma generate --schema "${schemaPath}"`);
run(`npx tsc -p "${tsconfigPath}"`);