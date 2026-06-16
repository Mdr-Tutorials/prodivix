import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(repoDir, 'apps/backend');
const isWindows = process.platform === 'win32';

function hasCommand(command) {
  const lookup = isWindows ? 'where.exe' : 'command';
  const args = isWindows ? [command] : ['-v', command];
  const result = spawnSync(lookup, args, {
    cwd: backendDir,
    shell: !isWindows,
    stdio: 'ignore',
  });

  return result.status === 0;
}

const useHotReload = hasCommand('air');
const command = isWindows
  ? useHotReload
    ? 'air.cmd'
    : 'go.exe'
  : useHotReload
    ? 'air'
    : 'go';
const args = useHotReload ? ['-c', '.air.toml'] : ['run', './cmd/server'];

if (!useHotReload) {
  console.warn('[backend] air not found; falling back to go run ./cmd/server.');
}

const child = spawn(command, args, {
  cwd: backendDir,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
