import { access, appendFile, readdir } from 'node:fs/promises';

const dir = 'work/screenshots';
await access(dir);
const files = (await readdir(dir)).filter((file) => file.endsWith('.png')).sort();
const report = [
  `# Screenshot Review ${new Date().toISOString()}`,
  '',
  `Files: ${files.join(', ')}`,
  '',
  'Checklist:',
  '',
  '- Glossy molded plastic: PASS if soldiers show hard highlights, oval bases, and contact shadows.',
  '- Miniature read: PASS if top/bottom vignette and giant props frame the combat lane.',
  '- Idle life: PASS if molder, hopper, units, and pickup feedback are visible across frames.',
  '- Silhouette: PASS if green, tan, and bosses differ at phone scale.',
  '- No programmer art: PASS if major surfaces have texture/highlight/packaging treatment.',
  '- Molder hero: PASS if the left-side machine is visually dominant.',
  '- Tap clarity: PASS if snap and upgrade buttons are obvious within the first viewport.',
  '',
  'Automated note: this script verifies screenshot presence. Visual grading is recorded manually or by subagent review.'
].join('\n');

await appendFile('work/screenshot-review.md', `${report}\n\n`);
console.log(report);
