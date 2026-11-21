# Chairs

Training deck for the **Diplomathon Global, Advanced Diplomat Cohort**. One hundred and eighteen slides across six modules, built to be taught live over a screen share and revised alone afterwards.

**Live:** https://chairs-xi.vercel.app

## What is in it

| Module | Slides | Source document |
|---|---|---|
| 0 · Orientation | 4 | Programme framing, provenance legend |
| 1 · Rules of Procedure | 33 | `Rules of Procedure.pdf` p.1–13 · `Conference Preparation Guide.pdf` p.6–9 |
| 2 · Effective Communication | 14 | `Communication.pdf` p.1–5 |
| 3 · Design Thinking | 13 | `Design Thinking.pdf` p.1–5 |
| 4 · Entrepreneurship & Innovation | 14 | `Entrepreneurship & Innovation.pdf` p.1–6 |
| 5 · Major Events That Changed the World | 15 | `Major Events that Changes the World.pdf` p.1–3 |
| 6 · Company Portfolio Prep Track | 23 | `company-portfolio-prep-track.md` §1–§7 · `Diplomathon Portfolio Prep Guide.pdf` p.1–2 · `Research Sources for Company Portfolios.pdf` p.1–4 |
| Close | 2 | Synthesis and source map |

## Provenance

Every line on a slide is tagged so a reader can tell instruction from rule:

- **Crimson tag**: the line traces to a Diplomathon source document, at the page named. In Module 1 these are procedural rules and are binding.
- **Green tag**: added instructional content written for this deck: named frameworks and documented dates, not Diplomathon rules.
- **Green-bordered box**: trainer technique, not a rule and not source.

Module 1 reproduces the previously verified 24-slide Rules of Procedure deck unchanged, plus checkpoint recaps and four slides from the Conference Preparation Guide (precedence of motions, a working paper, resolution rules, clause vocabulary). Its per-slide page mapping is in `VERIFICATION.md` in the parent project.

## Controls

| Key | Action |
|---|---|
| `←` `→` `Space` | Previous / next slide |
| `M` | Module index |
| `G` | Overview grid of every slide |
| `/` | Search all slides |
| `T` | Theme picker (7 themes) |
| `C` | Frame ratio: 16:9 or 2.39:1 cinematic scope |
| `S` | Slide sounds on/off (off by default) |
| `F` | Fullscreen |
| `P` | Print the deck as study notes, one slide per page |
| `Home` `End` | First / last slide |
| `?` | Keyboard reference |

## Sizing

Slides are authored on a fixed **1600 x 900 canvas** which is transform-scaled to fill whatever screen it lands on, the way presentation software works. Type is therefore a constant proportion of the frame at any display size. Body copy renders at roughly 31px on a 1920 screen and 42px on a 2560, so a screen share is legible without anyone zooming. A slide whose content would exceed the canvas shrinks only itself, just enough to fit.

Phones below 900px keep a fluid, scrollable layout instead; scaling a 1600px canvas down to a 390px screen would render body text at about 6px.

### Frame ratios

| Mode | Ratio | Canvas | Notes |
|---|---|---|---|
| Standard | 1.778:1 (16:9) | 1600 x 900 | Fills a screen share edge to edge |
| Scope | 2.39:1 | 2151 x 900 | Anamorphic cinematic widescreen, letterboxed, body lists go two-column |

Scope letterboxes against a matte black surround and switches the chrome to a light-on-dark treatment.

Edge-click advance is deliberately disabled so a stray click on a shared screen cannot move the deck. Swipe works on touch devices.

## For students

- **Your place is remembered.** Close the tab and reopen it; the deck offers to resume where you stopped.
- **Your progress is tracked.** Each slide you visit is marked, and every module shows how many of its slides you have covered.
- **See the whole deck at once.** Press `G` for an overview grid of all 118 slides as true miniatures, grouped by module; click any to jump.
- **Print study notes.** Press `P` to print the deck one slide per landscape page, ready to annotate.
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
