# Chairs site rebuild implementation plan

> **For agentic workers:** execute task by task, verify each step, commit at the end of each task. The session runs inline, sequentially.

**Goal:** Rebuild Chairs as a modular site: home, six module readers, a portfolio library, and the presentation deck, all generated from one source per module.

**Architecture:** `content/parts/*.html` hold slides in the existing section markup. `build.mjs`, with zero dependencies, validates the slides, externalises the eight photographs, renders the home page, module readers, library and a self-contained deck, then writes `dist/`. Vercel runs the build and serves `dist/`.

**Tech stack:** Node 24, plain HTML, CSS, ES modules, `node:test`, Playwright for verification.

---

## File structure

| Path | Responsibility |
|---|---|
| `content/site.json` | Programme metadata, module outcomes, sources, reading notes |
| `content/parts/00-orientation.html` | Orientation slides |
| `content/parts/01-rules.html` | Module 1 slides |
| `content/parts/02-communication.html` | Module 2 slides |
| `content/parts/03-design-thinking.html` | Module 3 slides |
| `content/parts/04-entrepreneurship.html` | Module 4 slides |
| `content/parts/05-major-events.html` | Module 5 slides |
| `content/parts/06-company-portfolio.html` | Module 6 slides |
| `content/parts/99-close.html` | Close slides |
| `content/library/portfolios.json` | Seven portfolio records |
| `src/tokens.css` | Shared colour and type tokens |
| `src/deck.css` | Presentation styles, extracted from the current style block |
| `src/site.css` | Reading-surface styles |
| `src/deck.js` | Presentation script, extracted from the current script block |
| `src/site.js` | Navigation, search dialog, library filter |
| `src/deck-shell.html` | Deck chrome and body shell with `{{CONTENT}}` placeholder |
| `build.mjs` | Generator and validator |
| `tests/build.test.mjs` | Build, counts, link crawl |
| `dist/` | Generated output, gitignored |

---

### Task 1: Scaffold and freeze the current deck

**Files:**
- Create: `package.json`, `.gitignore`, `src/legacy-index.html` (copy of `public/index.html`)
- Modify: `vercel.json`

- [ ] Copy `public/index.html` to `src/legacy-index.html` as the migration source.
- [ ] Add `package.json` with `"type": "module"`, `"build": "node build.mjs"`, `"test": "node --test tests"`, no dependencies.
- [ ] Add `.gitignore` for `dist/`, `node_modules/`, `.vercel/`, `.DS_Store`, `._*`.
- [ ] Verify `git status` shows the copy and config only.
- [ ] Commit: `chore: scaffold site build`.

### Task 2: Extract styles, script and deck shell

**Files:**
- Create: `src/tokens.css`, `src/deck.css`, `src/deck.js`, `src/deck-shell.html`
- Modify: `src/legacy-index.html` (temporary, to keep the old entry working)

- [ ] Split the style block at the end of the `:root` token block: tokens to `src/tokens.css`, the rest to `src/deck.css`.
- [ ] Extract the script block to `src/deck.js` unchanged.
- [ ] Extract the body minus slide sections to `src/deck-shell.html`, replacing the slides with `{{CONTENT}}` and leaving chrome, panels, dialogs and the `sr-status` region intact.
- [ ] Add a programme link to the chrome: `<a id="programme-link" href="../">Programme</a>`.
- [ ] Verify the extracted files parse: `node --check src/deck.js`.
- [ ] Commit: `refactor: extract deck styles, script and shell`.

### Task 3: Split the slides into module parts

**Files:**
- Create: `content/parts/00-orientation.html` ... `content/parts/99-close.html`
- Create: `content/site.json`

- [ ] Slice `src/legacy-index.html` at the section boundaries listed in the audit: Orientation 1 to 4, Module 1 5 to 37, Module 2 38 to 51, Module 3 52 to 64, Module 4 65 to 78, Module 5 79 to 93, Module 6 94 to 116, Close 117 to 118.
- [ ] Preserve slide order, `data-*` attributes and comments inside each part.
- [ ] Add `content/site.json` with six modules: number, slug, title, outcome, sources, reading note.
- [ ] Verify each part's slide count: 4, 33, 14, 13, 14, 15, 23, 2.
- [ ] Commit: `refactor: split deck into module source files`.

### Task 4: Build core, validation and tests

**Files:**
- Create: `build.mjs`, `tests/build.test.mjs`

- [ ] Implement `parseSlides(html)` returning sections with global index, module id, inner HTML and heading.
- [ ] Implement validation: each slide has one `h1`, a `data-module`, and a `.src` tag; fail the build with the slide number on violation.
- [ ] Implement `externaliseImages(html)` writing 8 JPEGs to `dist/assets/img/event-01.jpg` ... `event-08.jpg` and rewriting `<img src>` to `/assets/img/...`.
- [ ] Implement deck assembly: shell + slides, inline `tokens.css` and `deck.css`, inline `deck.js`, re-inline the externalised images as data URIs.
- [ ] Write tests asserting 118 slides before Task 5, then 114 after Task 5; deck contains inline CSS and JS; no `data:image` in reader output; every reader page exists.
- [ ] Run `node --test tests`; expected PASS.
- [ ] Commit: `feat: add zero-dependency build and validation`.

### Task 5: Restructure content

**Files:**
- Modify: `content/parts/01-rules.html`, `content/parts/06-company-portfolio.html`, `content/parts/99-close.html`

- [ ] Module 1: retitle the second title slide "Three days, 60 minutes".
- [ ] Module 1: remove research sources, key points and comparators slides; carry their unique lines into Module 6's seven-dimensions and five-points slides.
- [ ] Module 1: merge the "60 minutes done" buffer drills into the module recap and remove the separate close slide.
- [ ] Module 6: merge the five-points bridge with the country-versus-company table; fold comparators into the seven dimensions; fold general sources into the research hierarchy slide.
- [ ] Move roster and three source-sheet slides to `content/library/` data; leave Module 6 with 19 slides.
- [ ] Update module divider contents and recap copy to match.
- [ ] Verify counts: Orientation 4, M1 29, M2 14, M3 13, M4 14, M5 15, M6 19, library 4, close 2; total 114.
- [ ] Commit: `refactor: move research into Module 6 and extract the library`.

### Task 6: Portfolio library data and pages

**Files:**
- Create: `content/library/portfolios.json`
- Create: `src/site.css`, `src/site.js`, `src/pages/*` templates (or template functions in `build.mjs`)

- [ ] Encode all seven portfolios with the fields in the spec.
- [ ] Render `/library/` cards grouped by committee, with filter chips and disclosure for sources.
- [ ] Render four library appendix slides from the same data for the deck.
- [ ] Verify all seven records render and every filter yields at least one card.
- [ ] Commit: `feat: add portfolio library`.

### Task 7: Home, readers and search

**Files:**
- Modify: `build.mjs`, `src/site.css`, `src/site.js`

- [ ] Render `/`: masthead, contents table with module outcomes and counts, library and deck entry points, provenance legend, legacy `#sN` forwarding.
- [ ] Render six `/modules/<slug>/`: programme note, sticky contents, anchored sections from slides, recap, previous and next.
- [ ] Render `/404.html`.
- [ ] Generate `/search.json` and implement the keyboard search dialog on all site pages.
- [ ] Verify each reader has one `h1`, all 114 anchors unique, no horizontal overflow at 390.
- [ ] Commit: `feat: add home, module readers and search`.

### Task 8: Deck at /deck/

**Files:**
- Modify: `build.mjs`, `src/deck-shell.html`, `vercel.json`
- Create: `dist/deck/sw.js`, `dist/deck/manifest.webmanifest` (copied or generated)

- [ ] Emit `/deck/index.html` with inline styles, script and images.
- [ ] Copy `sw.js`, `manifest.webmanifest` and icons into `/deck/`; set service worker scope to `/deck/`.
- [ ] Update `vercel.json`: build command out of `package.json`, `outputDirectory: dist`, no-cache HTML, long cache assets, service-worker headers for `/deck/sw.js`.
- [ ] Verify deck features in Playwright: progress, overview count 114, search, themes, print.
- [ ] Commit: `feat: serve the rebuilt deck at /deck/`.

### Task 9: Verification and ship

**Files:** none

- [ ] `npm test` passes; build validation passes.
- [ ] Crawl internal links in `dist`; zero 404.
- [ ] Playwright at 1440x900 and 390x844 for `/`, `/modules/rules-of-procedure/`, `/modules/company-portfolio/`, `/library/`, `/deck/`; zero console errors.
- [ ] Print emulation on a module page and the deck.
- [ ] Push `master`; watch the Vercel deployment to READY.
- [ ] Verify every live route returns 200 and the deck reports 114 slides.
- [ ] Report commit, deploy, routes and checks.

## Self-review

- Spec coverage: sections 4 to 13 map to Tasks 3 to 9. The Library, legacy hash forwarding, image extraction, validation and deploy are each assigned.
- No placeholders: every task names files and a verification command.
- Type consistency: `parseSlides` input and output are defined in Task 4 and used again in Tasks 5 to 8; `portfolios.json` fields are defined in the spec and reused by the library and appendix.
