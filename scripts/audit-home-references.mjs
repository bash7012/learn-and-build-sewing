import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOME = path.join(ROOT, 'dist', 'index.html');

function visibleText(html) {
  return html
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#39|apos);/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const html = await readFile(HOME, 'utf8');
const section = html.match(
  /<section\b[^>]*class="[^"]*\breferences\b[^"]*"[^>]*>[\s\S]*?<\/section>/i,
)?.[0];
const failures = [];

if (!section) {
  failures.push('home page is missing the visible Base references section');
} else {
  const text = visibleText(section);
  const requiredText = [
    ['the explanatory paragraph', 'two books sit under everything here'],
    ['Aldrich usage', 'measurement points'],
    ['Aldrich usage', 'grading from aldrich'],
    ['Reader’s Digest usage', 'construction order'],
    ['Reader’s Digest usage', "reader's digest guide"],
    ['the paraphrase/source boundary', 'nothing on this site reproduces their instructions'],
    ['the paraphrase/source boundary', 'own words'],
    ['the Aldrich author', 'winifred aldrich'],
    ['the Aldrich title', "metric pattern cutting for children's wear and babywear"],
    ['the Reader’s Digest author', "the editors of reader's digest"],
    ['the Reader’s Digest title', 'complete guide to sewing'],
  ];

  for (const [label, phrase] of requiredText) {
    if (!text.includes(phrase)) failures.push(`home page is missing ${label}`);
  }

  const links = [...section.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1],
      text: visibleText(match[2]),
    }));
  const aldrichLink = links.find((link) =>
    link.text.includes("metric pattern cutting for children's wear and babywear"),
  );
  const digestLink = links.find((link) =>
    link.text.includes('complete guide to sewing'),
  );

  if (!aldrichLink || !/^https:\/\/(?:www\.)?wiley\.com\//i.test(aldrichLink.href)) {
    failures.push('the Aldrich title must link to its official Wiley page');
  }
  if (
    !digestLink ||
    !/^https:\/\/(?:www\.)?(?:tmbtradepublishing|simonandschuster)\.com\//i.test(
      digestLink.href,
    )
  ) {
    failures.push(
      'the Reader’s Digest title must link to Trusted Media Brands or Simon & Schuster',
    );
  }
}

if (failures.length) {
  console.error('Home reference audit failed:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('Home reference audit passed.');
