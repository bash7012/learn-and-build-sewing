# Learn and Build with Me

A personal static site for documenting a self-taught path through children's pattern drafting, grading, and construction. Markdown first; content starts rough and gets photos as each step is sewn.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local server at `localhost:4321` |
| `npm run build` | Write the static site to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run verify` | Typecheck, build, then run link/image/token/a11y/dependency audits |

Vercel runs `npm run verify` on every deploy. Preview URLs are the review board; only promote a passing preview to production.

## Content

- `src/content/foundations/` — measurements, bodice block, using the block
- `src/content/items/` — garments, starting with `baby-onesie/`
- `src/styles/tokens.css` — the only file for colors and fonts
