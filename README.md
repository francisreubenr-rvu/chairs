# Chairs

Training deck for the **Diplomathon Global — Advanced Diplomat Cohort**. One hundred and five slides across six modules, built to be taught live over a screen share and revised alone afterwards.

**Live:** _(added after first deploy)_

## What is in it

| Module | Slides | Source document |
|---|---|---|
| 0 · Orientation | 4 | Programme framing, provenance legend |
| 1 · Rules of Procedure | 29 | `Rules of Procedure.pdf` p.1–13 |
| 2 · Effective Communication | 14 | `Communication.pdf` p.1–5 |
| 3 · Design Thinking | 13 | `Design Thinking.pdf` p.1–5 |
| 4 · Entrepreneurship & Innovation | 14 | `Entrepreneurship & Innovation.pdf` p.1–6 |
| 5 · Major Events That Changed the World | 15 | `Major Events that Changes the World.pdf` p.1–3 |
| 6 · Company Portfolio Prep Track | 14 | `company-portfolio-prep-track.md` §1–§7 |
| Close | 2 | Synthesis and source map |

## Provenance

Every line on a slide is tagged so a reader can tell instruction from rule:

- **Crimson tag** — the line traces to a Diplomathon source document, at the page named. In Module 1 these are procedural rules and are binding.
- **Green tag** — added instructional content written for this deck: named frameworks and documented dates, not Diplomathon rules.
- **Green-bordered box** — trainer technique, not a rule and not source.

Module 1 reproduces the previously verified 24-slide Rules of Procedure deck unchanged, plus three checkpoint recaps. Its per-slide page mapping is in `VERIFICATION.md` in the parent project.

## Controls

| Key | Action |
|---|---|
| `←` `→` `Space` | Previous / next slide |
| `M` | Module index |
| `/` | Search all slides |
| `T` | Theme picker (7 themes) |
| `S` | Slide sounds on/off (off by default) |
| `F` | Fullscreen |
| `Home` `End` | First / last slide |

Edge-click advance is deliberately disabled so a stray click on a shared screen cannot move the deck. Swipe works on touch devices.

## For students

- **Your place is remembered.** Close the tab and reopen it; the deck offers to resume where you stopped.
- **Slides are linkable.** The URL carries `#s42`, so you can send a classmate an exact slide.
- **It works offline.** After the first visit a service worker caches the deck, so you can revise without a connection.
- **Seven themes**, all checked to WCAG AA contrast. Your choice is remembered.

## Accessibility

All seven themes are verified programmatically against WCAG AA (4.5:1 body text, 3:1 large text) across 237 text elements per theme. Slide changes are announced to screen readers, focus is visible, and `prefers-reduced-motion` is respected.

## Images

Eight historical photographs in Module 5, all public domain or CC BY-SA, credited on the slide and sourced from Wikimedia Commons.

## Structure

```
public/
  index.html            the whole deck, self-contained
  sw.js                 offline cache
  manifest.webmanifest  installable web app
vercel.json             headers
```

The deck is a single self-contained HTML file with images embedded as data URIs. There is no build step.
