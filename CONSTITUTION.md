# Constitution

These rules define done-right for this site. Every line is something a script or a short human pass can fail. A page is not shipped because someone said it was done.

## Privacy

- No child’s full name, face, school, address, or exact identifying measurements on a public page.
- Photos go in `public/images/` only if they pass the rule above.
- First names or “the baby” are fine. The Obsidian sewing vault stays private.

## Honesty

- Do not invent Aldrich or Reader’s Digest quotations or measurements.
- Cite the book; paraphrase in your own words.
- If a fact is only in your head, leave the placeholder.

## Base references

- The home page explains, in visible prose, which work uses Aldrich and which uses the Reader’s Digest guide, and says that the site paraphrases rather than reproduces their instructions.
- The home page visibly names Winifred Aldrich’s *Metric Pattern Cutting for Children’s Wear and Babywear* and the Editors of Reader’s Digest’s *Complete Guide to Sewing*.
- Each base reference links to its publisher: Wiley for Aldrich and Trusted Media Brands or Simon & Schuster for Reader’s Digest. `npm run audit:home-references` enforces these requirements.

## Status

- Frontmatter `status` is one of `draft`, `in-progress`, or `complete`, and it matches the page.
- Do not mark `complete` without a toile or construction photo when the page claims work was sewn.
- Draft pages may stay public if they are labeled `draft`.

## Sources and images

- Every `images[].src` exists under `public/`.
- Empty `images: []` is allowed.
- Every real photo has a non-empty `alt`.
- Every internal link resolves.

## Build

- `npm run build` succeeds.
- Colors and font families live only in `src/styles/tokens.css`.

## Access

- Skip link is present and points at `#main`.
- Each page has exactly one `h1`.
- Token contrast meets WCAG AA (4.5:1 for body text).
- No required text is hidden from screen readers (`aria-hidden`, `sr-only` used to stash content, or visually-hidden required passages).

## Ship surface

- No analytics or extra client JavaScript until deliberately chosen.
- No secrets in git.

## Appeals

If a check fails a page that is actually correct, fix the check, not the writing. Do not add vanity rules (word counts, padding) that force bad work. Local and remote `npm run verify` must pass before treating a deploy as shipped; pushing `main` updates Production.
