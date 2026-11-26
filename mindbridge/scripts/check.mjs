import { readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const folders = ['public', 'db', 'tests', 'scripts'];
const files = ['api.mjs', 'server.mjs'];
for (const folder of folders) {
  for (const name of await readdir(new URL('../' + folder, import.meta.url))) {
    if (/\.m?js$/.test(name)) files.push(folder + '/' + name);
  }
}
for (const file of files) {
  const path = new URL('../' + file, import.meta.url);
  const result = spawnSync(process.execPath, ['--check', decodeURIComponent(path.pathname)], { stdio:'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const asset of ['index.html','styles.css','student.css','teacher.css','assets/logo.svg','assets/bridge.svg','assets/NotoSansThai.ttf']) {
  const file = await stat(new URL('../public/' + asset, import.meta.url));
  if (!file.isFile() || file.size === 0) throw new Error('Missing release file ' + asset);
}
console.log(`Checked ${files.length} JavaScript sources and offline release assets.`);
