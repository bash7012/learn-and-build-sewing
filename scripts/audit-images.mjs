import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src', 'content');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function parseImages(frontmatter) {
  const block = frontmatter.match(/^images:\s*\n((?:[ \t]+.+\n)*)/m);
  if (!block) {
    if (/^images:\s*\[\s*\]\s*$/m.test(frontmatter)) return [];
    throw new Error('missing images field');
  }
  const lines = block[1].split('\n').filter((line) => line.trim());
  if (!lines.length) return [];
  const images = [];
  let current = null;
  for (const line of lines) {
    const src = line.match(/src:\s*(.+)$/);
    const alt = line.match(/alt:\s*(.+)$/);
    if (src) {
      current = { src: src[1].trim().replace(/^["']|["']$/g, '') };
      images.push(current);
    } else if (alt && current) {
      current.alt = alt[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return images;
}

const failures = [];
for (const file of await walk(CONTENT)) {
  const raw = await readFile(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const rel = path.relative(ROOT, file);
  if (!match) {
    failures.push(`${rel}: missing frontmatter`);
    continue;
  }
  let images;
  try {
    images = parseImages(match[1]);
  } catch (error) {
    failures.push(`${rel}: ${error.message}`);
    continue;
  }
  for (const image of images) {
    if (!image.src) {
      failures.push(`${rel}: image missing src`);
      continue;
    }
    if (!image.alt) {
      failures.push(`${rel}: ${image.src} is missing alt text`);
      continue;
    }
    const publicPath = path.join(ROOT, 'public', image.src.replace(/^\//, ''));
    try {
      await access(publicPath, constants.F_OK);
    } catch {
      failures.push(`${rel}: missing file public${image.src.startsWith('/') ? image.src : `/${image.src}`}`);
    }
  }
}

if (failures.length) {
  console.error('Image audit failed:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('Image audit passed.');
