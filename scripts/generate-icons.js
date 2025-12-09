import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw rounded rectangle background
  const radius = size * 0.15;
  ctx.fillStyle = '#6b46c1';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Draw "LC" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.45}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LC', size / 2, size / 2 + size * 0.05);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`./extension/icons/icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
});

console.log('Icons generated successfully!');
