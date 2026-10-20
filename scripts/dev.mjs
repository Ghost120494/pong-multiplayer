import { context } from 'esbuild';
import { spawn } from 'node:child_process';

let server;
let stopping = false;
const serverContext = await context({
  entryPoints: ['server.ts'], outfile: 'dist/server.js', bundle: true, platform: 'node', target: 'node20', format: 'cjs', logLevel: 'info',
  plugins: [{ name: 'restart-dev-server', setup(build) {
    build.onEnd(async result => {
      if (result.errors.length || stopping) return;
      if (server && server.exitCode === null) {
        const previous = server;
        await new Promise(resolve => { previous.once('exit', resolve); previous.kill('SIGTERM'); });
      }
      if (!stopping) server = spawn(process.execPath, ['dist/server.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
    });
  } }],
});
const clientContext = await context({ entryPoints: ['src/puppy/app.ts'], outfile: 'public/puppy-pals/app.js', bundle: true, platform: 'browser', target: 'es2020', format: 'esm', logLevel: 'info' });
await Promise.all([serverContext.watch(), clientContext.watch()]);
console.log('Watching Puppy Pals source. Refresh your browser after client changes.');
async function stop() {
  if (stopping) return;
  stopping = true;
  if (server && server.exitCode === null) server.kill('SIGTERM');
  await Promise.all([serverContext.dispose(), clientContext.dispose()]);
}
process.on('SIGINT', () => stop().then(() => process.exit(0)));
process.on('SIGTERM', () => stop().then(() => process.exit(0)));
