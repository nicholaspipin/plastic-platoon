import { access, readFile } from 'node:fs/promises';

const required = ['dist/index.html', 'dist/manifest.webmanifest', 'dist/icons/icon.svg', 'dist/sw.js'];

for (const file of required) {
  await access(file);
}

const index = await readFile('dist/index.html', 'utf8');
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const sw = await readFile('dist/sw.js', 'utf8');

if (!index.includes('./manifest.webmanifest')) {
  throw new Error('index.html does not reference root manifest.webmanifest');
}

if (!manifest.icons?.some((icon) => icon.src === './icons/icon.svg')) {
  throw new Error('manifest.webmanifest does not reference ./icons/icon.svg');
}

if (!sw.includes('./manifest.webmanifest')) {
  throw new Error('service worker does not precache root manifest.webmanifest');
}

console.log('PWA assets verified');
