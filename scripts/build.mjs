import { build } from 'esbuild';
import { mkdir, cp, rm, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const mode = process.argv[2] || 'web';

if (mode === 'test') {
  const tests = (await readdir('tests')).filter(name => name.endsWith('.test.ts'));
  if (!tests.length) throw new Error('No test files found; refusing a zero-test run');
  await mkdir('.test-build', { recursive: true });
  await build({ entryPoints: tests.map(name => `tests/${name}`), outdir: '.test-build', bundle: true, platform: 'node', target: 'node20', format: 'cjs', logLevel: 'info' });
  const runner = spawn(process.execPath, ['--test', ...tests.map(name => `.test-build/${name.replace(/\.ts$/, '.js')}`)], { stdio: 'inherit' });
  runner.on('error', error => { console.error(error); process.exitCode = 1; });
  runner.on('exit', (code, signal) => { process.exitCode = signal ? 1 : code ?? 1; });
} else {
  await Promise.all([
    build({ entryPoints: ['server.ts'], outfile: 'dist/server.js', bundle: true, platform: 'node', target: 'node20', format: 'cjs', logLevel: 'info' }),
    build({ entryPoints: ['src/puppy/app.ts'], outfile: 'public/puppy-pals/app.js', bundle: true, platform: 'browser', target: 'es2020', format: 'esm', logLevel: 'info' }),
  ]);
  if (mode === 'mobile') {
    // Native bundles contain only the game; no server code, credentials, or data.
    await rm('dist/mobile', { recursive: true, force: true });
    await mkdir('dist/mobile', { recursive: true });
    await Promise.all(['index.html', 'privacy.html', 'manifest.webmanifest', 'puppy-pals'].map(name => cp(`public/${name}`, `dist/mobile/${name}`, { recursive: true })));
    console.log('Mobile web assets prepared at dist/mobile. Native projects must still be generated, signed and tested.');
  }
}
