// Usage: npm run images -- path/to/prototype.html
// Finds every "key": "data:image/...;base64,..." pair and writes client/public/images/<key>.jpg
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2] || 'prototype.html';
if (!fs.existsSync(src)) {
  console.error(`File not found: ${src}\nSave your prototype as prototype.html in the project root, or pass its path.`);
  process.exit(1);
}
const html = fs.readFileSync(src, 'utf8');
const out = path.resolve('client/public/images');
fs.mkdirSync(out, { recursive: true });

const re = /"([\w-]+)"\s*:\s*"data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)"/g;
let match, count = 0;
while ((match = re.exec(html))) {
  const [, key, type, data] = match;
  const ext = type === 'jpeg' ? 'jpg' : type;
  fs.writeFileSync(path.join(out, `${key}.${ext}`), Buffer.from(data, 'base64'));
  console.log(`  ✓ ${key}.${ext}`);
  count++;
}
console.log(`${count} image(s) written to ${out}`);