import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = dirname(new URL(import.meta.url).pathname);
const DIST = join(ROOT, 'dist');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const site = JSON.parse(read('content/site.json'));

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'deck'), { recursive: true });

const PARTS = [
  ['00-orientation', 'orientation'],
  ['01-rules', 1],
  ['02-communication', 2],
  ['03-design-thinking', 3],
  ['04-entrepreneurship', 4],
  ['05-major-events', 5],
  ['06-company-portfolio', 6],
];

const library = JSON.parse(read('content/library/portfolios.json'));

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- library appendix slides, generated from data ---------- */

function librarySlide(title, kicker, inner, src) {
  return {
    section: `<section class="slide" data-module="7" data-pace="Reference" data-src="${src}">
  <div class="slide-inner">
    <div class="kicker">${kicker} <span class="src">${src}</span></div>
    <h1>${escapeHtml(title)}</h1>
    ${inner}
  </div>
</section>`,
    module: '7',
    title,
    inner,
    divider: false,
    hasSource: true,
    file: 'library',
  };
}

function portfolioPanel(p) {
  const row = (label, text) => `<li><b>${label}</b><span class="sub">${escapeHtml(text)}</span></li>`;
  const rows = [];
  if (p.delegate) rows.push(row('Delegate', `${p.delegate} · ${p.committee}`));
  else rows.push(row('Committee', p.committee));
  rows.push(row('What it is', p.purpose));
  if (p.bestAngle) rows.push(row('Best angle', p.bestAngle));
  if (p.primary.length) rows.push(row('Primary', p.primary.join(' · ')));
  if (p.bodies.length) rows.push(row('Bodies to cite', p.bodies.join(' · ')));
  if (p.laws.length) rows.push(row('Law to cite', p.laws.join(' · ')));
  if (p.notes.length) rows.push(row('Note', p.notes.join(' ')));
  return `<div class="panel"><div class="col-head">${escapeHtml(p.company)}</div><ul class="bullets">${rows.join('')}</ul></div>`;
}

function librarySlides() {
  const all = library.portfolios;
  const byId = (id) => all.find((p) => p.id === id);
  const roster = `<p class="lead">Seven portfolios across five committees. Find your line before you research anything else: the committee decides which sources count.</p>
    <div class="rule"></div>
    <table class="pace-table dense wide-first">
      <thead><tr><th>Portfolio</th><th>Committee</th><th>The angle that decides the room</th></tr></thead>
      <tbody>${all.map((p) => `<tr><td>${escapeHtml(p.company)}</td><td>${escapeHtml(p.committee)}</td><td>${escapeHtml(p.angles.join(', '))}</td></tr>`).join('')}</tbody>
    </table>
    <div class="callout">
      <b>Three portfolios share one committee.</b> BioSerenity, the US HHS Secretary and ASICS all sit in Sports, Health &amp; Bioscience. Expect the same agenda argued from a device maker, a regulator and a performance brand.
    </div>`;

  const sheet = (title, kicker, ids, cols) => {
    const inner = `<div class="rule"></div><div class="cols-${cols}">${ids.map((id) => portfolioPanel(byId(id))).join('')}</div>`;
    return librarySlide(title, kicker, inner, 'Research Sources p.1–4');
  };

  return [
    librarySlide('Who is in which room, and what each one has to prove', 'Portfolio Library · seven portfolios', roster, 'Research Sources p.1–4'),
    sheet('Two companies selling into the same skills agenda', 'Portfolio Library · education and skills', ['sap-successfactors', 'cisco-systems'], 2),
    sheet('Two industries where the regulator is younger than the product', 'Portfolio Library · space and tourism', ['space-adventures', 'tripadvisor'], 2),
    sheet('Three portfolios in one committee, three different kinds of power', 'Portfolio Library · health and sport', ['bioserenity', 'us-hhs', 'asics'], 3),
  ];
}

function fail(msg) {
  console.error('BUILD ERROR: ' + msg);
  process.exit(1);
}

/* ---------- parse source parts ---------- */

function parseSlides(html, partName) {
  const sections = html.match(/<section class="slide[\s\S]*?<\/section>/g) || [];
  if (!sections.length) fail(`${partName} contains no slides`);
  return sections.map((section) => {
    const mod = (section.match(/data-module="([^"]+)"/) || [])[1];
    const h1 = (section.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    const innerMatch = section.match(/<div class="slide-inner[^"]*">([\s\S]*)<\/div>\s*<\/section>/);
    return {
      section,
      module: mod,
      title: h1 ? stripTags(h1) : '',
      inner: innerMatch ? innerMatch[1] : section,
      divider: section.includes('module-divider'),
      hasSource: /data-src="/.test(section),
      file: partName,
    };
  });
}

const slides = [];
for (const [part, mod] of PARTS) {
  const parsed = parseSlides(read(`content/parts/${part}.html`), part);
  for (const s of parsed) {
    if (mod !== 'orientation' && mod !== 'close' && s.module !== String(mod)) {
      fail(`${part}: slide "${s.title}" has data-module="${s.module}", expected ${mod}`);
    }
    if (!s.hasSource) fail(`${part}: slide "${s.title}" has no data-src attribute`);
    if (!s.title) fail(`${part}: slide without h1`);
    slides.push(s);
  }
}

for (const s of librarySlides()) slides.push(s);

for (const s of parseSlides(read('content/parts/99-close.html'), '99-close')) {
  if (s.module !== '8') fail(`99-close: slide "${s.title}" has data-module="${s.module}", expected 8`);
  if (!s.hasSource || !s.title) fail(`99-close: slide "${s.title}" is missing a source tag or heading`);
  slides.push(s);
}

slides.forEach((s, i) => { s.index = i + 1; });

if (slides.length < 3) fail('slide count suspiciously low');

/* ---------- externalise the embedded photographs ---------- */

const IMG_DIR = join(DIST, 'assets/img');
mkdirSync(IMG_DIR, { recursive: true });
const imageFiles = new Map();

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function externaliseImages(html) {
  let n = 0;
  return html.replace(/src="data:image\/(jpeg|png);base64,([^"]+)"/g, (_m, type, b64) => {
    const buf = Buffer.from(b64, 'base64');
    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
    const name = `event-${hash}.${type === 'jpeg' ? 'jpg' : 'png'}`;
    const file = join(IMG_DIR, name);
    if (!existsSync(file)) writeFileSync(file, buf);
    imageFiles.set(name, type);
    n++;
    const size = type === 'jpeg' ? jpegSize(buf) : null;
    const dims = size ? ` width="${size.w}" height="${size.h}"` : '';
    return `src="/assets/img/${name}"${dims} loading="lazy"`;
  });
}

function inlineImages(html) {
  return html.replace(/src="\/assets\/img\/([^"]+)"/g, (_m, name) => {
    const buf = readFileSync(join(IMG_DIR, name));
    const type = name.endsWith('.png') ? 'png' : 'jpeg';
    return `src="data:image/${type};base64,${buf.toString('base64')}"`;
  });
}

const externalisedSlides = slides.map((s) => ({ ...s, section: externaliseImages(s.section), inner: externaliseImages(s.inner) }));

/* ---------- deck ---------- */

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=Source+Code+Pro:wght@500;600&family=Space+Grotesk:wght@400;500;600;700&family=Archivo+Black&family=Nunito:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';

/* ---------- site pages ---------- */

const moduleByN = new Map(site.modules.map((m) => [m.n, m]));
const modules = site.modules;
const moduleCount = (n) => slides.filter((s) => s.module === String(n)).length;
const firstSlideOf = (n) => slides.find((s) => s.module === String(n) && !s.divider);
const builtOn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function pageHead({ title, description, path, ogType = 'website' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#F1EBDD">
<meta name="color-scheme" content="light">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="https://chairs-xi.vercel.app${path}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${FONTS}
</head>
<body>`;
}

function chrome(active) {
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap">
    <a class="wordmark" href="/">Chairs <span>Diplomat Training Programme</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Programme">
      ${link('/#contents', 'Modules', 'modules')}
      ${link('/library/', 'Library', 'library')}
      ${link('/deck/', 'Deck', 'deck')}
      <button class="search-open" type="button" aria-haspopup="dialog">Search <kbd>/</kbd></button>
    </nav>
  </div>
</header>`;
}

function searchDialog() {
  return `<dialog id="search" aria-label="Search the programme">
  <div class="search-inner">
    <label class="search-label" for="search-input">Search the programme</label>
    <input id="search-input" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="Company, motion, clause, event" aria-controls="search-results">
    <button class="search-close" type="button" aria-label="Close search">Close</button>
    <p class="search-hint">Type to filter. Enter opens the top result. Escape closes.</p>
    <ul id="search-results" aria-live="polite"></ul>
  </div>
</dialog>`;
}

function footer() {
  return `<footer class="site-foot">
  <div class="wrap">
    <div>
      <p class="foot-h">Chairs</p>
      <p>${escapeHtml(site.programme)}. Taught by Francis Reuben R. Every rule line is tagged to the Diplomathon page it came from.</p>
    </div>
    <div>
      <p class="foot-h">Read</p>
      <ul>
        ${modules.map((m) => `<li><a href="/modules/${m.slug}/">${escapeHtml(m.title)}</a></li>`).join('')}
        <li><a href="/library/">Portfolio Library</a></li>
      </ul>
    </div>
    <div>
      <p class="foot-h">Colophon</p>
      <p>Paper and ink. Cormorant Garamond, Source Sans 3 and Source Code Pro. Updated ${builtOn}.</p>
    </div>
  </div>
</footer>`;
}

function page({ title, description, path, active, body, extraScript = '' }) {
  return `${pageHead({ title, description, path })}
${chrome(active)}
<main id="main">
${body}
</main>
${footer()}
${searchDialog()}
${extraScript}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function homePage() {
  const rows = modules.map((m) => `<a class="contents-row" href="/modules/${m.slug}/">
  <span class="cr-n">${String(m.n).padStart(2, '0')}</span>
  <span><span class="cr-t">${escapeHtml(m.title)}</span><span class="cr-d">${escapeHtml(m.outcome)}</span></span>
  <span class="cr-c">${moduleCount(m.n)} sections</span>
</a>`).join('');

  const body = `<section class="cover">
  <div class="wrap">
    <p class="eyebrow">${escapeHtml(site.programme)}</p>
    <h1>Chairs</h1>
    <p class="tagline">${escapeHtml(site.tagline)}</p>
    <div class="meta-row">
      <span>6 modules</span><span>7 portfolios</span><span>114-slide deck</span><span>Taught live, read alone</span>
    </div>
    <div class="actions">
      <a class="btn" href="/modules/rules-of-procedure/">Start with Module One</a>
      <a class="btn ghost" href="/deck/">Open the presentation deck</a>
    </div>
  </div>
</section>

<section class="wrap">
  <div class="section-head" id="contents"><h2>Contents</h2><span>Six modules, one programme</span></div>
  <div class="contents">
    ${rows}
    <a class="contents-row library" href="/library/">
      <span class="cr-n">Ref</span>
      <span><span class="cr-t">Portfolio Library</span><span class="cr-d">${escapeHtml(site.library.note)}</span></span>
      <span class="cr-c">7 portfolios</span>
    </a>
  </div>
</section>

<section class="wrap">
  <div class="section-head"><h2>Two ways to use it</h2><span>Teach, then revise</span></div>
  <div class="usage">
    <div class="panel">
      <h3>Teach it</h3>
      <p>The deck is built for a shared screen: one idea per slide, seven themes, an overview grid, and a print export for study notes.</p>
      <a class="link" href="/deck/">Open the deck</a>
    </div>
    <div class="panel">
      <h3>Revise it</h3>
      <p>Each module also reads as a page. The same slides, set for reading, with every line tagged to its source and a contents list for the session.</p>
      <a class="link" href="/modules/rules-of-procedure/">Read Module One</a>
    </div>
  </div>
</section>

<section class="wrap">
  <div class="section-head"><h2>How to read the tags</h2><span>Instruction is never disguised as rule</span></div>
  <div class="cols-3">
    <div class="panel">
      <div class="col-head">Crimson tag</div>
      <p>The line traces to a Diplomathon document, at the page named. In Module 1 those are binding procedural rules.</p>
    </div>
    <div class="panel">
      <div class="col-head">Green tag</div>
      <p>Added instructional content: named frameworks and documented dates, not Diplomathon rules. Trainer technique sits in green-bordered boxes.</p>
    </div>
    <div class="panel">
      <div class="col-head">Library</div>
      <p>Seven portfolios and their sources. Reference material, kept out of the taught sequence because it is looked up, not taught.</p>
    </div>
  </div>
</section>`;

  const legacy = `<script>if (/^#s\\d+$/.test(location.hash)) { location.replace('/deck/' + location.hash); }
if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { if (r.scope === location.origin + '/') r.unregister(); }); }); }</script>`;
  return page({
    title: 'Chairs · Diplomat Training Programme',
    description: site.description,
    path: '/',
    active: 'modules',
    body,
    extraScript: legacy,
  });
}

function renderLesson(slide) {
  if (slide.divider) return '';
  let inner = slide.inner;
  inner = inner.replace(/<h1/, `<h2 id="t${slide.index}"`);
  inner = inner.replace(/<\/h1>/, '</h2>');
  inner = inner.replace(/<table/g, '<div class="table-scroll"><table').replace(/<\/table>/g, '</table></div>');
  return `<section class="lesson" id="s${slide.index}" aria-labelledby="t${slide.index}">
${inner}
</section>`;
}

function modulePage(mod) {
  const own = externalisedSlides.filter((s) => s.module === String(mod.n));
  const lessons = own.filter((s) => !s.divider);
  const toc = lessons.map((s, i) => `<li><a href="#s${s.index}"><span>${String(i + 1).padStart(2, '0')}</span>${escapeHtml(s.title)}</a></li>`).join('');
  const prev = modules.find((m) => m.n === mod.n - 1);
  const next = modules.find((m) => m.n === mod.n + 1);
  const prevHref = prev ? `/modules/${prev.slug}/` : '/';
  const prevLabel = prev ? prev.title : 'Programme';
  const nextHref = next ? `/modules/${next.slug}/` : '/library/';
  const nextLabel = next ? next.title : 'Portfolio Library';

  const body = `<div class="module-head">
  <div class="wrap">
    <div class="breadcrumb"><a href="/">Programme</a> <span>/</span> <span>Module ${mod.n}</span></div>
    <h1>${escapeHtml(mod.title)}</h1>
    <p class="outcome">${escapeHtml(mod.outcome)}</p>
    <div class="module-meta">
      <span>${lessons.length} sections</span>
      ${mod.sources.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}
    </div>
  </div>
</div>

<div class="wrap">
  <div class="reader">
    <aside class="toc" aria-label="In this module">
      <p class="toc-h">In this module</p>
      <ol>${toc}</ol>
    </aside>
    <div class="article">
      <details class="toc-mobile">
        <summary>In this module</summary>
        <ol>${toc}</ol>
      </details>
      <div class="programme-note"><span class="tag">Programme note</span>${escapeHtml(mod.note)}</div>
      ${lessons.map(renderLesson).join('\n')}
      <nav class="reader-foot" aria-label="Module navigation">
        <a href="${prevHref}"><span class="rf-n">Previous</span><span class="rf-t">${escapeHtml(prevLabel)}</span></a>
        <a class="next" href="${nextHref}"><span class="rf-n">Next</span><span class="rf-t">${escapeHtml(nextLabel)}</span></a>
      </nav>
      <div class="sources-block">
        <b>Sources for this module</b>
        <ul>${mod.sources.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
</div>`;

  return {
    path: `/modules/${mod.slug}/`,
    html: page({
      title: `Chairs · ${mod.title}`,
      description: mod.outcome,
      path: `/modules/${mod.slug}/`,
      active: 'modules',
      body,
    }),
  };
}

function portfolioCard(p) {
  const angles = p.angles.map((a) => `<span>${escapeHtml(a)}</span>`).join('');
  const list = (label, items) => items.length ? `<h4>${label}</h4><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '';
  return `<article class="folio" id="${p.id}" data-committee="${escapeHtml(slugify(p.committee))}">
  <h3>${escapeHtml(p.company)}</h3>
  ${p.delegate ? `<p class="delegate">${escapeHtml(p.delegate)}</p>` : ''}
  <p class="purpose">${escapeHtml(p.purpose)}</p>
  ${p.bestAngle ? `<p class="best">${escapeHtml(p.bestAngle)}</p>` : ''}
  <div class="angle-chips">${angles}</div>
  <details>
    <summary>Sources to cite</summary>
    <div class="src-list">
      ${list('Primary', p.primary)}
      ${list('Bodies', p.bodies)}
      ${list('Law', p.laws)}
      ${list('Note', p.notes)}
    </div>
  </details>
</article>`;
}

function libraryPage() {
  const groups = library.committees.map((c) => {
    const items = library.portfolios.filter((p) => p.committee === c);
    if (!items.length) return '';
    return `<section class="committee-group" data-group="${escapeHtml(slugify(c))}">
  <h2>${escapeHtml(c)}</h2>
  <div class="folio-grid">${items.map(portfolioCard).join('')}</div>
</section>`;
  }).join('');

  const chips = ['All', ...library.committees].map((c, i) => {
    const value = i === 0 ? 'all' : slugify(c);
    return `<button class="chip" type="button" data-filter="${escapeHtml(value)}" aria-pressed="${i === 0}">${escapeHtml(c)}</button>`;
  }).join('');

  const body = `<div class="library-head">
  <div class="wrap">
    <div class="breadcrumb"><a href="/">Programme</a> <span>/</span> <span>Library</span></div>
    <h1>Portfolio Library</h1>
    <p class="note">${escapeHtml(site.library.note)}</p>
    <div class="module-meta">${site.library.sources.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</div>
  </div>
</div>
<div class="wrap">
  <div class="filterbar" role="group" aria-label="Filter by committee">
    ${chips}
    <span class="filter-count" id="filter-count">${library.portfolios.length} portfolios</span>
  </div>
  ${groups}
</div>`;

  return page({
    title: 'Chairs · Portfolio Library',
    description: site.library.note,
    path: '/library/',
    active: 'library',
    body,
  });
}

function notFoundPage() {
  return page({
    title: 'Chairs · Page not found',
    description: 'That page is not part of the programme.',
    path: '/404.html',
    active: '',
    body: `<div class="wrap notfound"><p class="eyebrow">404</p><h1>Nothing on this page.</h1><p>The slide, module or library entry you asked for does not exist. Start from the contents.</p><div class="actions"><a class="btn" href="/">Programme contents</a></div></div>`,
  });
}

function searchIndex() {
  const entries = [];
  for (const s of slides) {
    if (!['1', '2', '3', '4', '5', '6'].includes(s.module)) continue;
    const mod = moduleByN.get(Number(s.module));
    const text = stripTags(s.inner).slice(0, 600);
    entries.push({ t: s.title, m: `Module ${mod.n} · ${mod.title}`, u: `/modules/${mod.slug}/#s${s.index}`, x: text });
  }
  for (const p of library.portfolios) {
    entries.push({
      t: p.company,
      m: `Library · ${p.committee}`,
      u: `/library/#${p.id}`,
      x: stripTags([p.purpose, ...p.angles, ...p.primary, ...p.laws].join(' ')).slice(0, 600),
    });
  }
  return { entries };
}

function deckPage() {
  const css = read('src/tokens.css') + '\n' + read('src/deck.css');
  const js = read('src/deck.js');
  const shell = read('src/deck-shell.html');
  const body = shell.replace('{{CONTENT}}', externalisedSlides.map((s) => s.section).join('\n\n'));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chairs · Presentation Deck</title>
<meta name="description" content="${escapeHtml(site.description)}">
<meta name="theme-color" content="#8E2230">
<meta name="color-scheme" content="light dark">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Chairs">
<meta property="og:title" content="Chairs · Presentation Deck">
<meta property="og:description" content="${slides.length} slides across six modules for the Diplomathon Global Advanced Diplomat Cohort.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://chairs-xi.vercel.app/deck/">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Chairs · Presentation Deck">
<meta name="twitter:description" content="${slides.length} slides across six modules for the Diplomathon Global Advanced Diplomat Cohort.">
${FONTS}
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;
  return inlineImages(html);
}

/* ---------- write ---------- */

writeFileSync(join(DIST, 'deck/index.html'), deckPage());
for (const f of ['sw.js', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  copyFileSync(join(ROOT, 'public', f), join(DIST, 'deck', f));
}

mkdirSync(join(DIST, 'assets'), { recursive: true });
mkdirSync(join(DIST, 'library'), { recursive: true });

writeFileSync(join(DIST, 'index.html'), homePage());
writeFileSync(join(DIST, '404.html'), notFoundPage());
writeFileSync(join(DIST, 'library/index.html'), libraryPage());
for (const mod of modules) {
  const p = modulePage(mod);
  const dir = join(DIST, p.path.replace(/^\/|\/$/g, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), p.html);
}

writeFileSync(join(DIST, 'assets/site.css'), read('src/tokens.css') + '\n' + read('src/site.css'));
copyFileSync(join(ROOT, 'src/site.js'), join(DIST, 'assets/site.js'));
for (const f of ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  copyFileSync(join(ROOT, 'public', f), join(DIST, 'assets', f));
}

writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify({
  name: 'Chairs · Diplomat Training Programme',
  short_name: 'Chairs',
  start_url: '/',
  display: 'standalone',
  background_color: '#F1EBDD',
  theme_color: '#8E2230',
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));

writeFileSync(join(DIST, 'search.json'), JSON.stringify(searchIndex()));

console.log(`Built ${slides.length}-slide deck and ${modules.length} module pages: ${imageFiles.size} images`);
export { slides, site, stripTags, escapeHtml };
