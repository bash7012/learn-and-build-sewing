import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TOKENS = path.join(ROOT, 'src', 'styles', 'tokens.css');
const MIN_RATIO = 4.5;

function hexToRgb(hex) {
  let value = hex.replace('#', '');
  if (value.length === 3) {
    value = value.split('').map((char) => char + char).join('');
  }
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function channel(part) {
  const scaled = part / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function routeFromFile(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/\/index\.html$/, '/')}`;
}

const tokens = await readFile(TOKENS, 'utf8');
const colors = Object.fromEntries(
  [...tokens.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map(
    (match) => [match[1], match[2]],
  ),
);

const pairs = [
  ['text', 'bg'],
  ['text-muted', 'bg'],
  ['accent', 'bg'],
  ['accent', 'accent-soft'],
  ['on-accent', 'accent'],
  ['text', 'bg-sidebar'],
  ['text', 'bg-elevated'],
  ['status-draft-text', 'status-draft-bg'],
  ['status-progress-text', 'status-progress-bg'],
  ['status-complete-text', 'status-complete-bg'],
];

const failures = [];

for (const [fg, bg] of pairs) {
  const ratio = contrast(colors[fg], colors[bg]);
  if (ratio < MIN_RATIO) {
    failures.push(
      `contrast ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (need ${MIN_RATIO}:1)`,
    );
  }
}

for (const file of await walk(DIST)) {
  const html = await readFile(file, 'utf8');
  const route = routeFromFile(file);
  if (!html.includes('href="#main"') || !html.includes('id="main"')) {
    failures.push(`${route}: missing skip link to #main`);
  }
  const headings = html.match(/<h1\b/g) ?? [];
  if (headings.length !== 1) {
    failures.push(`${route}: expected 1 h1, found ${headings.length}`);
  }
  for (const img of html.matchAll(/<img\b([^>]*)>/g)) {
    const attrs = img[1];
    const alt = attrs.match(/\balt="([^"]*)"/);
    if (!alt || !alt[1].trim()) {
      failures.push(`${route}: image missing non-empty alt`);
    }
  }
  if (/aria-hidden="true"[\s\S]{0,200}(Aldrich|Reader's Digest|required)/i.test(html)) {
    failures.push(`${route}: required text may be hidden from assistive tech`);
  }
  if (/class="[^"]*(?:sr-only|visually-hidden|hidden)[^"]*"[\s\S]{0,120}(Aldrich|Reader's Digest)/i.test(html)) {
    failures.push(`${route}: citation appears visually hidden`);
  }
}

if (failures.length) {
  console.error('Accessibility audit failed:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('Accessibility audit passed.');
