# Chairs

The Advanced Diplomat Cohort programme for Diplomathon Global. Six taught modules, a portfolio library, and a presentation deck, all generated from one source per module.

**Live:** https://chairs-xi.vercel.app
**Deck:** https://chairs-xi.vercel.app/deck/
**Library:** https://chairs-xi.vercel.app/library/

## Pages

| Route | What it is |
|---|---|
| `/` | Programme cover and contents |
| `/modules/rules-of-procedure/` | Module 1 reader |
| `/modules/effective-communication/` | Module 2 reader |
| `/modules/design-thinking/` | Module 3 reader |
| `/modules/entrepreneurship/` | Module 4 reader |
| `/modules/major-events/` | Module 5 reader |
| `/modules/company-portfolio/` | Module 6 reader |
| `/library/` | Seven portfolios, sources and laws to cite, filterable by committee |
| `/deck/` | The presentation deck, self-contained and offline capable |

## The programme

| Section | Slides | Source |
|---|---|---|
| Orientation | 4 | Programme framing, provenance legend |
| 1 · Rules of Procedure | 29 | `Rules of Procedure.pdf` p.1–13 · `Conference Preparation Guide.pdf` p.6–9 |
| 2 · Effective Communication | 14 | `Communication.pdf` p.1–5 |
| 3 · Design Thinking | 13 | `Design Thinking.pdf` p.1–5 |
| 4 · Entrepreneurship & Innovation | 14 | `Entrepreneurship & Innovation.pdf` p.1–6 |
| 5 · Major Events That Changed the World | 15 | `Major Events that Changes the World.pdf` p.1–3 |
| 6 · Company Portfolio | 19 | `company-portfolio-prep-track.md` §1–§7 · `Portfolio Prep Guide.pdf` p.1–2 · `Research Sources for Company Portfolios.pdf` p.1–4 |
| Portfolio Library | 4 appendix slides | `Research Sources for Company Portfolios.pdf` p.1–4 |
| Close | 2 | Synthesis, source map |

Deck total: 114 slides. Reading pages: 110 taught sections, plus seven portfolio entries.

Module 1 is procedure only. Research, sourcing and company portfolio work sit in Module 6, where they belong.

## Provenance

Every line on a slide is tagged:

- **Crimson tag**: traces to a Diplomathon source document, at the page named. In Module 1 these are binding procedural rules.
- **Green tag**: added instructional content. Named frameworks and documented dates, not Diplomathon rules.
- **Green-bordered box**: trainer technique, not a rule and not a source.

The Portfolio Library is reference material, kept out of the taught sequence.

## Build

The site has no runtime dependencies. Content lives in `content/`, presentation and reading styles in `src/`, and `build.mjs` generates `dist/`.

```
node build.mjs     # generate dist/
npm test           # build, then validate counts, headings, links and anchors
```

Vercel runs `node build.mjs` and serves `dist/`.

```text
content/
  site.json                  programme metadata, module outcomes and notes
  parts/*.html               slides in presentation order, one file per module
  library/portfolios.json    seven portfolio records
src/
  tokens.css                 colour and type tokens
  deck.css                   presentation styles
  deck.js                    presentation interactions
  deck-shell.html            deck chrome with a content placeholder
  site.css                   reading-surface styles
  site.js                    navigation, search, library filter
build.mjs                    generator and validator
tests/site.test.mjs          build and link validation
```

The deck is generated as one self-contained HTML file: inline styles, inline script, images as data URIs, its own manifest and service worker under `/deck/`. The reading pages share `/assets/site.css` and reference the eight photographs as files.

## Deck controls

| Key | Action |
|---|---|
| `←` `→` `Space` | Previous / next slide |
| `M` | Module index |
| `G` | Overview grid of every slide |
| `/` | Search all slides |
| `T` | Theme picker, seven themes |
| `C` | Frame ratio: 16:9 or 2.39:1 scope |
| `S` | Slide sounds on or off |
| `P` | Print the deck as study notes |
| `?` | Keyboard reference |
| `Home` `End` | First / last slide |

Slide state, theme and sound choice are remembered per browser. Slides are linkable as `#s42`. Phones below 900px scroll the slide body rather than shrinking the canvas.

## Accessibility

One `h1` per page, landmarks, a skip link, visible focus, labelled dialogs and 44px primary touch targets. The seven deck themes were checked against WCAG AA in the previous deck revision; the reading surfaces use the same token contrast. Motion respects `prefers-reduced-motion`.

## Images

Eight historical photographs in Module 5, all public domain or CC BY-SA, credited on the slide and sourced from Wikimedia Commons. The deck inlines them; readers load them from `/assets/img/`.

## Notes

- Root deep links are preserved: `/#s42` forwards to `/deck/#s42`.
- The previous root-scope service worker is unregistered when the new home page loads, so returning visitors get the site rather than a cached deck.
- `src/legacy-index.html` is a local migration copy and is gitignored.
