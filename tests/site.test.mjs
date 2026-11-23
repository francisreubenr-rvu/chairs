import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const DIST = join(ROOT, 'dist');
const read = (p) => readFileSync(join(DIST, p), 'utf8');

before(() => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
});

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

test('deck contains every slide', () => {
  const deck = read('deck/index.html');
  const sections = deck.match(/<section class="slide/g) || [];
  assert.equal(sections.length, 114);
});

test('deck is self-contained', () => {
  const deck = read('deck/index.html');
  assert.match(deck, /<style>/);
  assert.match(deck, /querySelectorAll\('\.slide'\)/);
  assert.doesNotMatch(deck, /src="\/assets\/img\//, 'deck must inline images');
  const inline = deck.match(/src="data:image\/jpeg;base64,/g) || [];
  assert.equal(inline.length, 8);
});

test('photographs are extracted for the reading pages', () => {
  const files = readdirSync(join(DIST, 'assets/img'));
  assert.equal(files.length, 8);
});

test('deck ships its own service worker and manifest', () => {
  assert.ok(existsSync(join(DIST, 'deck/sw.js')));
  assert.ok(existsSync(join(DIST, 'deck/manifest.webmanifest')));
});

test('every slide has a heading and a source tag', () => {
  const deck = read('deck/index.html');
  const sections = deck.match(/<section class="slide[\s\S]*?<\/section>/g) || [];
  for (const [i, s] of sections.entries()) {
    assert.match(s, /<h1[^>]*>/, `slide ${i + 1} missing h1`);
    assert.match(s, /data-src="/, `slide ${i + 1} missing data-src`);
  }
});

test('source parts stay in sync with the build', () => {
  const parts = ['00-orientation', '01-rules', '02-communication', '03-design-thinking', '04-entrepreneurship', '05-major-events', '06-company-portfolio', '99-close'];
  let total = 0;
  for (const p of parts) {
    const html = readFileSync(join(ROOT, 'content/parts', p + '.html'), 'utf8');
    total += (html.match(/<section class="slide/g) || []).length;
  }
  assert.equal(total, 110);
  const portfolios = JSON.parse(readFileSync(join(ROOT, 'content/library/portfolios.json'), 'utf8'));
  assert.equal(portfolios.portfolios.length, 7);
});

test('every site page exists with exactly one h1', () => {
  const pages = ['index.html', 'library/index.html', '404.html', ...readdirSync(join(DIST, 'modules')).map((m) => `modules/${m}/index.html`)];
  assert.equal(pages.length, 9);
  for (const p of pages) {
    const html = read(p);
    const h1 = html.match(/<h1[\s>]/g) || [];
    assert.equal(h1.length, 1, `${p} should have one h1`);
  }
});

test('module readers carry every section and a programme note', () => {
  const expectations = { 'rules-of-procedure': 28, 'effective-communication': 13, 'design-thinking': 12, entrepreneurship: 13, 'major-events': 14, 'company-portfolio': 18 };
  for (const [slug, count] of Object.entries(expectations)) {
    const html = read(`modules/${slug}/index.html`);
    const lessons = html.match(/<section class="lesson"/g) || [];
    assert.equal(lessons.length, count, `${slug} lesson count`);
    assert.match(html, /Programme note/);
  }
});

test('library renders every portfolio with sources', () => {
  const html = read('library/index.html');
  const cards = html.match(/<article class="folio"/g) || [];
  assert.equal(cards.length, 7);
  assert.match(html, /SAP SuccessFactors/);
  assert.match(html, /EU AI Act/);
  assert.match(html, /Portfolio Library/);
});

test('search index covers taught slides and portfolios', () => {
  const index = JSON.parse(read('search.json'));
  assert.ok(index.entries.length > 100);
  assert.ok(index.entries.some((e) => e.u === '/library/#sap-successfactors'));
  assert.ok(index.entries.every((e) => e.u.startsWith('/')));
});

test('reader pages do not embed base64 images', () => {
  for (const p of ['modules/major-events/index.html', 'modules/company-portfolio/index.html']) {
    assert.doesNotMatch(read(p), /data:image/);
  }
});

test('every internal link resolves, and every hash target exists', () => {
  const htmlFiles = walk(DIST).filter((f) => extname(f) === '.html');
  const problems = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      let url = m[1];
      if (url.startsWith('//')) continue;
      const [path, hash] = url.split('#');
      const clean = path.split('?')[0];
      let target = join(DIST, clean);
      if (clean.endsWith('/')) target = join(target, 'index.html');
      if (!existsSync(target)) { problems.push(`${file}: missing ${url}`); continue; }
      if (hash && extname(target) === '.html') {
        const targetHtml = readFileSync(target, 'utf8');
        if (!new RegExp(`id="${hash}"`).test(targetHtml)) problems.push(`${file}: missing anchor ${url}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});
