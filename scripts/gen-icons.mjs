// Generates PWA icons (180/192/512) by rendering a canvas in headless Chromium.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const HTML = `<!doctype html><html><body style="margin:0">
<canvas id="c"></canvas>
<script>
function draw(size) {
  const c = document.getElementById('c');
  c.width = size; c.height = size;
  const x = c.getContext('2d');
  const s = size / 100; // draw in 100-unit space

  // blister-card background
  const g = x.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#5b8a35');
  g.addColorStop(1, '#3f6423');
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);

  // subtle sunburst
  x.save();
  x.translate(50 * s, 42 * s);
  x.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 12; i++) {
    x.rotate(Math.PI / 6);
    x.beginPath();
    x.moveTo(0, 0);
    x.arc(0, 0, 75 * s, -0.13, 0.13);
    x.fill();
  }
  x.restore();

  // oval base
  x.fillStyle = '#2c451a';
  x.beginPath();
  x.ellipse(50 * s, 78 * s, 26 * s, 7 * s, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#365722';
  x.beginPath();
  x.ellipse(50 * s, 76.5 * s, 24 * s, 6 * s, 0, 0, Math.PI * 2);
  x.fill();

  // soldier silhouette (cream, like a sticker)
  x.fillStyle = '#f5e9d0';
  x.strokeStyle = '#f5e9d0';
  x.lineCap = 'round';
  // legs
  x.lineWidth = 9 * s;
  x.beginPath(); x.moveTo(48*s, 52*s); x.lineTo(38*s, 74*s); x.stroke();
  x.beginPath(); x.moveTo(52*s, 52*s); x.lineTo(61*s, 74*s); x.stroke();
  // torso
  x.beginPath(); x.roundRect(41*s, 30*s, 18*s, 26*s, 7*s); x.fill();
  // rifle
  x.lineWidth = 4.5*s;
  x.beginPath(); x.moveTo(44*s, 40*s); x.lineTo(74*s, 27*s); x.stroke();
  // arm
  x.lineWidth = 7*s;
  x.beginPath(); x.moveTo(52*s, 38*s); x.lineTo(64*s, 32*s); x.stroke();
  // helmet
  x.beginPath();
  x.arc(50*s, 22*s, 12*s, Math.PI, 0);
  x.quadraticCurveTo(63*s, 28*s, 60*s, 29.5*s);
  x.lineTo(40*s, 29.5*s);
  x.quadraticCurveTo(37*s, 28*s, 38*s, 22*s);
  x.fill();
  // helmet spec
  x.fillStyle = '#5b8a35';
  x.beginPath();
  x.ellipse(46*s, 17*s, 5*s, 2.2*s, -0.5, 0, Math.PI * 2);
  x.fill();
}
</script></body></html>`;

mkdirSync('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(HTML);
for (const size of [180, 192, 512]) {
  await page.evaluate((s) => draw(s), size);
  const el = page.locator('#c');
  await el.screenshot({ path: `public/icons/icon-${size}.png` });
  console.log(`icon-${size}.png`);
}
await browser.close();
