import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const TOKENS = path.join(SRC, 'styles', 'tokens.css');
const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.mjs', '.js']);

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGB = /\b(?:rgb|hsl)a?\(/;

function hasForbiddenFont(line) {
  const match = line.match(/font-family\s*:\s*([^;]+)/);
  if (!match) return false;
  return !match[1].trim().startsWith('var(');
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const failures = [];
for (const file of await walk(SRC)) {
  if (path.resolve(file) === path.resolve(TOKENS)) continue;
  const lines = (await readFile(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    if (HEX.test(line) || RGB.test(line) || hasForbiddenFont(line)) {
      failures.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (failures.length) {
  console.error('Token audit failed. Colors and font-family literals must live in src/styles/tokens.css:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('Token audit passed.');
