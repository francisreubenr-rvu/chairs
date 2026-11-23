# PLAN — Chairs: update with the three new Diplomathon sources

Started 2026-11-21. Two workstreams: integrate three newly supplied PDFs, and ship the deck upgrades left uncommitted on 24 August.

## Sources received

| File | Pages | Destination |
|---|---|---|
| `Conference Preparation Guide.pdf` | 9 | Module 1: precedence of motions, working paper sample, resolution rules, clause vocabulary |
| `Diplomathon Portfolio Prep Guide.pdf` | 2 | Module 6: eight-step routine, four worked portfolios, how they win committee |
| `Research Sources for Company Portfolios.pdf` | 4 | Module 6: primary/secondary hierarchy and citation, seven-portfolio roster, per-portfolio source sheets |

## Deliverables checklist (this session)

| # | Item | Status |
|---|------|--------|
| 1 | Verify Vercel connection and identify project (`chairs`, git-connected to `francisreubenr-rvu/chairs`, production branch `master`) | done |
| 2 | Module 1: precedence of motions (p.6) | done |
| 3 | Module 1: working paper anatomy (p.4, p.7) | done |
| 4 | Module 1: resolution rules (p.5, p.8) | done |
| 5 | Module 1: preambulatory / operative clause vocabulary (p.9) | done |
| 6 | Module 6: eight-step prep routine (Prep Guide p.1) | done |
| 7 | Module 6: worked portfolios Sony / Boeing (Prep Guide p.1) | done |
| 8 | Module 6: worked portfolios ILO / Palantir (Prep Guide p.2) | done |
| 9 | Module 6: how they win the committee (Prep Guide p.2) | done |
| 10 | Module 6: research hierarchy and citation format (Research Sources p.1) | done |
| 11 | Module 6: seven-portfolio roster (Research Sources p.1–4) | done |
| 12 | Module 6: source sheets SAP / Cisco, Space Adventures / Tripadvisor, BioSerenity / HHS / ASICS (Research Sources p.1–4) | done |
| 13 | Update dividers, module index source map, counts, welcome letter, close source map, README | done |
| 14 | Local verification: 13 new slides desktop, mobile 390px, overview grid, search, console | done |
| 15 | Ship: commit, push to `master` (Vercel git integration), verify live desktop and mobile | done |

## Carried over from the 24 August plan

| # | Item | Status |
|---|------|--------|
| A | Overview grid (`G`): scaled live miniatures of every slide, grouped by module, click to jump, current and visited markers | done, shipped in this commit |
| B | Visited-slide tracking, per-module progress in the index and overview header | done |
| C | Keyboard help overlay (`?`) | done |
| D | Print study notes export (`P`) | done |
| E | Overview chrome button and offset recalculation | done |
| F | Font loading, og/twitter meta, service worker cache bump to `chairs-v5`, README | done |
| G | Local verification desktop and ~390px, all themes, console clean | done |
| H | Ship and verify live | done |

## Constraints
- No invented content: every new line traces to one of the three PDFs, tagged with its page.
- Existing design tokens and slide classes only. Zero emojis, zero em dashes.
- Single self-contained file, no build step.
- Module 1's verified 24-slide teach stays unchanged; new slides are additive and say so.

## Done log
- 2026-11-21: Vercel CLI authenticated as `francisreubenr-rvu`; project `chairs` found, production URL `https://chairs-xi.vercel.app`; git integration confirmed via API (`link.type: github`, repo `chairs`, production branch `master`). Deck at 118 slides across six modules plus close: Module 1 33, Module 6 23. Playwright pass at 1440x900 and 390x844: no overflow, no horizontal scroll, overview built 118 thumbnails, search returned hits, zero console errors. Not merged: remote branch `mobile-tap-nav` (separate feature, remains unmerged).

## 2026-11-23 · Site rebuild

Spec: `docs/superpowers/specs/2026-11-23-chairs-site-rebuild-design.md`
Plan: `docs/superpowers/plans/2026-11-23-chairs-site-rebuild.md`

| # | Deliverable | Status |
|---|---|---|
| 1 | Scaffold: package.json, gitignore, module source parts, site config | done |
| 2 | Extract tokens, deck CSS, deck JS, deck shell | done |
| 3 | Build: parse, validate, externalise images, self-contained deck | done |
| 4 | Content restructure: Module 1 procedure only, research consolidated into Module 6 | done |
| 5 | Portfolio library data, library page, four appendix slides | done |
| 6 | Home, six module readers, search index, 404 | done |
| 7 | Deck at `/deck/`, service worker scope, Vercel build config | done |
| 8 | Tests: counts, one h1 per page, links and anchors | done |
| 9 | Desktop and mobile verification, print, live deploy | pending |

Result: 114-slide deck, six readers, seven library entries. Module 1 dropped to 29 slides; Module 6 is 19.
