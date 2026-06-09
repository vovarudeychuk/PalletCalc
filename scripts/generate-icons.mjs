import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2563eb"/>
  <rect x="112" y="288" width="288" height="48" rx="8" fill="#9a6229"/>
  <rect x="128" y="224" width="80" height="64" rx="8" fill="#cd813f"/>
  <rect x="216" y="224" width="80" height="64" rx="8" fill="#cd813f"/>
  <rect x="304" y="224" width="80" height="64" rx="8" fill="#cd813f"/>
  <rect x="128" y="144" width="80" height="64" rx="8" fill="#cd813f"/>
  <rect x="216" y="144" width="80" height="64" rx="8" fill="#cd813f"/>
  <rect x="304" y="144" width="80" height="64" rx="8" fill="#cd813f"/>
</svg>`;

mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(join(iconsDir, `icon-${size}.png`), buffer);
}

console.log('PWA icons generated in public/icons/');
