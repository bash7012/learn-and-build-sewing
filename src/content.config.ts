import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pageSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  status: z.enum(['draft', 'in-progress', 'complete']),
  sources: z.array(z.string()),
  images: z.array(
    z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
    }),
  ),
  order: z.number().optional(),
  specs: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

const foundations = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/foundations',
  }),
  schema: pageSchema,
});

const items = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/items',
    generateId: ({ entry }) =>
      entry.replace(/\.md$/, '').replace(/\/index$/, ''),
  }),
  schema: pageSchema,
});

export const collections = { foundations, items };