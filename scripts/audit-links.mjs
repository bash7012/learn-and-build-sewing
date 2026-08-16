import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

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
  return `/${rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '')}`;
}

function resolveHref(fromFile, href) {
  const [withoutHash] = href.split('#');
  if (!withoutHash) return null;
  if (/^(https?:|mailto:|tel:|data:)/i.test(withoutHash)) return null;
  const url = withoutHash.startsWith('/')
    ? withoutHash
    : path.posix.normalize(
        path.posix.join(path.posix.dirname(routeFromFile(fromFile)), withoutHash),
      );
  return url.endsWith('/') && url !== '/' ? url : url;
}

async function exists(url) {
  const clean = url.replace(/\/$/, '') || '/';
  const candidates = [
    path.join(DIST, clean, 'index.html'),
    path.join(DIST, `${clean}.html`),
    path.join(DIST, clean),
  ];
  if (clean === '/') candidates.unshift(path.join(DIST, 'index.html'));
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}

const files = await walk(DIST);
const failures = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const hrefs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    const url = resolveHref(file, href);
    if (!url) continue;
    if (!(await exists(url))) {
      failures.push(`${routeFromFile(file)} → ${href}`);
    }
  }
}

if (failures.length) {
  console.error('Link audit failed:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`Link audit passed (${files.length} pages).`);
