# Chairs site rebuild: design spec

Date: 2026-11-23
Status: awaiting approval
Owner: Francis Reuben R

## 1. Problem

The deck grew from a 24-slide Rules of Procedure teach into 118 slides in one 1.4 MB HTML file. Three defects followed:

| Defect | Evidence |
|---|---|
| Misfiled content | Module 1, "Rules of Procedure", ends with five research slides: sources p.13, key research points, comparators |
| Duplication | Module 6 repeats the five research points and comparator sets already covered by those Module 1 slides; two slides are both titled "Rules of Procedure" |
| No reading surface | 118 presentation slides are the only way to consume the material. Revising alone means clicking through a deck. |
| Editing risk | One file holds all content, styles, scripts and eight base64 photographs |

The programme is taught live and revised alone. Only the first use is served by a deck.

## 2. Goals

1. Separate teaching from reference: six taught modules, plus an unnumbered Portfolio Library.
2. Give the material a reading surface: home, six module pages, library.
3. Keep one source of truth per module. Reading pages and the deck are generated from the same content, never hand-duplicated.
4. Restore Module 1 to procedure only; consolidate research into Module 6.
5. Keep the paper-and-ink identity, offline deck, print export, and WCAG AA.

## 3. Non-goals

- No new lesson content. Only short connective prose for reading pages, tagged as a programme note.
- No rewrite of source-verified lines.
- No CMS, database, auth, analytics, or npm dependencies.
- No seventh taught module.
- No change to the seven themes or the 1600x900 presentation canvas.

## 4. Information architecture

Six taught modules, one reference library, one deck.

| Section | Slides | Role |
|---|---|---|
| Orientation | 4 | Programme framing, provenance legend |
| 1 Rules of Procedure | 29 | How the committee runs. Procedure only. |
| 2 Effective Communication | 14 | Delivery and listening |
| 3 Design Thinking | 13 | Problem definition and tested solutions |
| 4 Entrepreneurship & Innovation | 14 | Feasibility and growth |
| 5 Major Events | 15 | Historical precedent |
| 6 Company Portfolio | 19 | Research method, routine, worked portfolios, checklist |
| Library (unnumbered) | 4 appendix slides | Seven portfolios, sources, laws to cite |
| Close | 2 | Synthesis, source map |

Deck total: 114 slides (was 118).

## 5. Content moves

### Module 1

| Current | Action |
|---|---|
| Slide 6, second "Rules of Procedure" title | Retitle "Three days, 60 minutes"; keep the arc |
| Slide 33, research sources | Fold unique general sources into Module 6 research hierarchy; retire |
| Slide 34, key points to research | Merge with Module 6 slide 97 into one country-versus-company table |
| Slide 35, comparators | Fold into Module 6 slide 96, seven dimensions |
| Slide 36, "60 minutes done" | Merge buffer drills into the module recap; retire |
| Slides 29 to 32, precedence, samples, clauses | Stay in Module 1; they are procedure |

Module 1 result: divider, arc, session map, 25 procedural slides, recap.

### Module 6

Order: divider, the question, seven dimensions (with comparators), five points bridge, filings, signals and market data, regulatory, competitive and ESG, people and press, stages 0 to 2, stages 3 to 5, Google worked template, eight-step routine, Sony and Boeing, ILO and Palantir, how they win, research hierarchy and citation, checklist, recap.

### Library

Extracted from Module 6 slides 111 to 114 into one structured data file: seven portfolios with committee, purpose, angle, allies, tough question, primary sources, bodies, laws, notes. Rendered as a library page and as four appendix slides in the deck.

## 6. Pages

| Route | Purpose | Composition |
|---|---|---|
| `/` | Programme cover and contents | Masthead, promise, contents table with module counts and outcomes, library and deck entry points, provenance legend |
| `/modules/<slug>/` | Reading surface for one module | Programme note, section-by-section article with anchors, source tags, recap and self-test, previous and next |
| `/library/` | Portfolio reference | Filter by committee; one card per portfolio with purpose, angle, tough question, sources and laws |
| `/deck/` | Live presentation | Restructured deck, existing themes, overview, search, progress, print |
| `/404.html` | Not found | Link back to contents and library |

Module slugs: `rules-of-procedure`, `effective-communication`, `design-thinking`, `entrepreneurship`, `major-events`, `company-portfolio`.

Legacy deep links: if `/` receives `#s42`, forward to `/deck/#s42`, because old shared links point at the deck root.

## 7. Source of truth and build

```
content/
  site.json                 programme metadata, module outcomes, source lines
  parts/00-orientation.html slides in current section markup
  parts/01-rules.html
  parts/02-communication.html
  ...
  parts/06-company-portfolio.html
  parts/99-close.html
  library/portfolios.json    seven portfolio records
src/
  tokens.css                shared colour, type, spacing
  deck.css                  presentation styles, from the current style block
  site.css                  reading surface styles
  deck.js                   current script block, extracted
  site.js                   navigation, search dialog, library filter
build.mjs                   zero-dependency generator
```

`build.mjs` steps:

1. Parse each part into slide sections; validate every slide has a heading, a source tag, and a module id matching its file.
2. Extract the eight base64 photographs to `assets/img/`; readers reference files, the deck build inlines them again so it stays portable.
3. Render home, six module pages, library, deck and 404.
4. Emit `search.json`.
5. Fail the build on validation errors rather than shipping a broken deck.

Output goes to `dist/`. Vercel builds with `node build.mjs` and serves `dist/`. No npm dependencies.

The deck stays self-contained: one HTML file, inline styles, inline scripts, inline images, its own manifest and service worker under `/deck/`.

## 8. Data

`site.json`:

```json
{
  "programme": "Diplomathon Global · Advanced Diplomat Cohort",
  "title": "Chairs",
  "modules": [
    {
      "n": 1,
      "slug": "rules-of-procedure",
      "title": "Rules of Procedure",
      "outcome": "Run and survive a committee session under the written rules",
      "sources": ["Rules of Procedure.pdf p.1–13", "Conference Preparation Guide p.6–9"],
      "note": "Two or three sentences of connective prose, marked as a programme note."
    }
  ]
}
```

`portfolios.json`:

```json
{
  "id": "sap-successfactors",
  "company": "SAP SuccessFactors",
  "committee": "Education, HR & Future of Work",
  "delegate": "Roohi Deshpande",
  "purpose": "SAP's AI-driven cloud HR suite, part of SAP since 2012.",
  "angles": ["Micro-credentials", "AI tutors", "AI hiring", "The four-day week"],
  "allies": [],
  "toughQuestion": { "q": "", "a": "" },
  "primary": [],
  "bodies": [],
  "laws": [],
  "notes": []
}
```

## 9. Design direction

Keep the existing paper-and-ink identity; sharpen the hierarchy for reading.

| Surface | Treatment |
|---|---|
| Home | A printed programme cover: masthead, crimson folio, contents table with dot leaders, module outcomes, counts |
| Module page | A course reader: 68-character measure, sticky section contents on desktop, hairline rules, source tags in the margin |
| Library | Reference cards grouped by committee, filter chips, sources behind disclosure |
| Deck | Projection surface: unchanged canvas, themes and chrome, with a link back to the programme |

Tokens unchanged: warm cream, near-black ink, crimson accent under 10 percent of any screen. Cormorant Garamond for display, Source Sans 3 for body, Source Code Pro for meta. No gradients, no card shadows, no stock imagery. Motion limited to a 120 ms fade; `prefers-reduced-motion` respected.

Mobile: single column, contents collapsed into a disclosure, 44 px touch targets, no horizontal scroll.

## 10. Accessibility and performance

- One `h1` per page, ordered headings, landmarks, skip link, visible focus.
- Search is a keyboard dialog with labelled results; Escape closes.
- Contrast checked on all seven deck themes and the site surfaces at AA.
- Reading pages ship one shared CSS file and one small script; no fonts blocked behind JS.
- Deck keeps its offline cache; reading pages are server-cached HTML.

## 11. Verification

| Check | Method |
|---|---|
| Build validity | Generator exits non-zero on missing headings or source tags |
| Content parity | Every source slide appears once; counts match the table in section 4 |
| Links | Crawl all internal links in `dist`; zero 404 |
| Desktop and mobile | Playwright at 1440x900 and 390x844 for home, Module 1, Module 6, library, deck |
| Interactions | Module contents, library filter, search dialog, deck overview, print emulation |
| Console and network | Zero errors, zero failed requests |
| Live | Vercel READY, production URLs return 200, new pages present |

## 12. Rollout

1. Scaffold the build and extract styles, scripts and images. No content moves yet.
2. Move and merge content; extract the library; retitle duplicates.
3. Build home, readers and library; restructure the deck.
4. Verify, then ship on `master`. Vercel deploys from the build output.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Slide markup breaks the reader renderer | Reader renders the existing `slide-inner` markup with reading CSS; every one of the 114 slides is screenshotted |
| Images duplicated across readers | Extracted to files; deck re-inlines only in its own output |
| Root URL change breaks old deep links | Home forwards `#sN` hashes to the deck |
| Vercel build misconfigured | Verify build command and output directory against a preview deploy before production |
| Scope creep into rewriting lessons | Content changes limited to the moves in section 5 |
