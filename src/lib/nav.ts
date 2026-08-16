import type { CollectionEntry } from 'astro:content';

export const SITE_TITLE = "How to Build and Sew Your Kids' Wardrobe From Scratch";

const BRANCH_SLUGS = new Set(['self-drafted', 'graded-pattern']);

export type NavLink = {
  id: string;
  title: string;
  href: string;
  status: CollectionEntry<'foundations'>['data']['status'];
};

export type ItemGroup = {
  slug: string;
  title: string;
  href?: string;
  branches: NavLink[];
  shared: NavLink[];
};

export type SiteNav = {
  foundations: NavLink[];
  items: ItemGroup[];
};

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sortByOrder<T extends { data: { order?: number; title: string } }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.data.title.localeCompare(b.data.title);
  });
}

function toLink(
  collection: 'foundations' | 'items',
  entry: CollectionEntry<'foundations'> | CollectionEntry<'items'>,
): NavLink {
  return {
    id: entry.id,
    title: entry.data.title,
    href: `/${collection}/${entry.id}`,
    status: entry.data.status,
  };
}

export function isCurrentPath(href: string, currentPath: string): boolean {
  const normalize = (path: string) => path.replace(/\/$/, '') || '/';
  return normalize(href) === normalize(currentPath);
}

export function buildNav(
  foundations: CollectionEntry<'foundations'>[],
  items: CollectionEntry<'items'>[],
): SiteNav {
  const groups = new Map<string, CollectionEntry<'items'>[]>();

  for (const entry of items) {
    const slug = entry.id.includes('/') ? entry.id.split('/')[0] : entry.id;
    const list = groups.get(slug) ?? [];
    list.push(entry);
    groups.set(slug, list);
  }

  return {
    foundations: sortByOrder(foundations).map((entry) =>
      toLink('foundations', entry),
    ),
    items: [...groups.entries()].map(([slug, entries]) => {
      const hub = entries.find((entry) => entry.id === slug);
      const rest = entries.filter((entry) => entry.id !== slug);
      const branches = sortByOrder(
        rest.filter((entry) => {
          const leaf = entry.id.split('/').at(-1) ?? entry.id;
          return BRANCH_SLUGS.has(leaf);
        }),
      ).map((entry) => toLink('items', entry));
      const shared = sortByOrder(
        rest.filter((entry) => {
          const leaf = entry.id.split('/').at(-1) ?? entry.id;
          return !BRANCH_SLUGS.has(leaf);
        }),
      ).map((entry) => toLink('items', entry));

      return {
        slug,
        title: hub?.data.title ?? titleFromSlug(slug),
        href: hub ? `/items/${hub.id}` : undefined,
        branches,
        shared,
      };
    }),
  };
}