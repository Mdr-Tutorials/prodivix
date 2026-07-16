import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const allowedCommands = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'corepack',
  'node',
]);

const readPayload = async () => {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 384 * 1024 * 1024) throw new TypeError('Sandbox payload is too large.');
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Sandbox payload must be an object.');
  return value;
};

const childPath = (path) => {
  if (typeof path !== 'string' || !path || path.includes('\\'))
    throw new TypeError('Sandbox file path is invalid.');
  const target = resolve('/workspace', ...path.split('/'));
  const child = relative('/workspace', target);
  if (!child || child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child))
    throw new TypeError('Sandbox file path escaped the workspace.');
  return target;
};

const command = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Sandbox command is invalid.');
  if (!allowedCommands.has(value.command))
    throw new TypeError('Sandbox command is not allowlisted.');
  if (
    !Array.isArray(value.args) ||
    value.args.length > 256 ||
    value.args.some((arg) => typeof arg !== 'string' || arg.length > 16_384)
  )
    throw new TypeError('Sandbox command arguments are invalid.');
  return { command: value.command, args: value.args };
};

const run = async (value, environment) =>
  new Promise((resolveRun, rejectRun) => {
    const child = spawn(value.command, value.args, {
      cwd: '/workspace',
      env: environment,
      shell: false,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', rejectRun);
    child.once('close', (code, signal) => {
      if (signal) resolveRun(128);
      else resolveRun(code ?? 1);
    });
  });

try {
  const payload = await readPayload();
  if (!Array.isArray(payload.files) || payload.files.length > 20_000)
    throw new TypeError('Sandbox files are invalid.');
  for (const file of payload.files) {
    if (!file || typeof file !== 'object' || typeof file.contents !== 'string')
      throw new TypeError('Sandbox file is invalid.');
    const target = childPath(file.path);
    const contents = Buffer.from(file.contents, 'base64');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, { flag: 'wx', mode: 0o600 });
  }
  const environment = { PATH: process.env.PATH, HOME: '/tmp' };
  if (!Array.isArray(payload.publicEnvironment))
    throw new TypeError('Sandbox public environment is invalid.');
  for (const entry of payload.publicEnvironment) {
    if (
      !entry ||
      typeof entry.name !== 'string' ||
      typeof entry.value !== 'string' ||
      !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(entry.name)
    )
      throw new TypeError('Sandbox public environment entry is invalid.');
    environment[entry.name] = entry.value;
  }
  const install = await run(command(payload.installCommand), environment);
  if (install !== 0) process.exit(install);
  process.exit(await run(command(payload.command), environment));
} catch {
  process.exit(125);
}
