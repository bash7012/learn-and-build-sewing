// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';

// https://astro.build/config
const site =
  process.env.PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export default defineConfig({
  site,
  output: 'static',
});
