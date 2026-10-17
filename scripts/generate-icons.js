/**
 * Script para generar iconos PNG desde el favicon SVG
 * Requiere: npm install sharp
 * Ejecutar: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// Asegurar que existe el directorio
mkdirSync(iconsDir, { recursive: true });

const svgContent = readFileSync(join(publicDir, 'favicon.svg'), 'utf-8');

// Crear SVG con fondo para maskable
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#F5F0E6"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#C4785A" stroke-width="6"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#C4785A" stroke-width="6"
          stroke-dasharray="283" stroke-dashoffset="70" stroke-linecap="round"
          transform="rotate(-90 50 50)"/>
  <circle cx="50" cy="50" r="8" fill="#C4785A"/>
</svg>
`;

async function generateIcons() {
  // Icon 192x192
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // Icon 512x512
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // Maskable Icon 512x512 (con fondo)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(join(iconsDir, 'icon-maskable-512.png'));
  console.log('Generated icon-maskable-512.png');

  // Apple Touch Icon 180x180
  await sharp(Buffer.from(maskableSvg))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
