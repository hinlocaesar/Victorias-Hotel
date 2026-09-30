/* Assertion pass: checks every bug found during review via computed styles. */
const { chromium } = require('playwright');

const results = [];
const assert = (name, pass, detail) => results.push({ pass, name, detail });

(async () => {
  const b = await chromium.launch();

  // ---------- desktop ----------
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto('http://localhost:4173', { waitUntil: 'networkidle' });

  // walk the page so every scroll-reveal has had a chance to fire
  await d.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await d.waitForTimeout(900);

  const desk = await d.evaluate(() => {
    const w = (sel, all) => {
      const els = all ? [...document.querySelectorAll(sel)] : [document.querySelector(sel)];
      return els.filter(Boolean).map((e) => Math.round(e.getBoundingClientRect().width));
    };
    const cols = (sel) => getComputedStyle(document.querySelector(sel).parentElement).gridTemplateColumns;
    const cards = [...document.querySelectorAll('.art-card')];

    return {
      captionIcons: w('.art-caption .ico', true),
      captionTexts: [...document.querySelectorAll('.art-caption')].map((c) =>
        (c.textContent || '').trim().slice(0, 40)
      ),
      artCardSvg: w('.art-card > svg', true),
      artCardWidths: cards.map((c) => Math.round(c.getBoundingClientRect().width)),
      captionInsideCard: cards.every((c) => {
        const cap = c.querySelector('.art-caption').getBoundingClientRect();
        const card = c.getBoundingClientRect();
        return cap.left >= card.left - 1 && cap.right <= card.right + 1;
      }),
      roomsCols: cols('.room'),
      facilityCols: cols('.facility'),
      galleryCols: cols('.tile'),
      discoverCols: cols('.discover-card'),
      galleryTileHeights: [...document.querySelectorAll('.tile')].map((t) =>
        Math.round(t.getBoundingClientRect().height)
      ),
      oversizedIcons: [...document.querySelectorAll('.ico')]
        .map((i) => Math.round(i.getBoundingClientRect().width))
        .filter((n) => n > 70),
      navOpen: document.querySelector('#nav').classList.contains('open'),
      revealCount: document.querySelectorAll('.reveal').length,
      revealed: document.querySelectorAll('.reveal.in').length
    };
  });

  assert(
    'caption icons are normal size (no svg selector bleed)',
    desk.captionIcons.length > 0 && desk.captionIcons.every((n) => n > 5 && n < 40),
    desk.captionIcons.join(', ') + ' px'
  );
  assert(
    'caption text sits inside its card',
    desk.captionInsideCard,
    desk.captionTexts.join(' | ')
  );
  assert(
    'rooms render 4-up on desktop',
    desk.roomsCols.split(' ').filter((c) => parseFloat(c) > 50).length === 4,
    desk.roomsCols
  );
  assert('facilities render 3-up on desktop', /^[\d.]+px [\d.]+px [\d.]+px$/.test(desk.facilityCols), desk.facilityCols);
  assert('gallery renders 3-up on desktop', desk.galleryCols.split(' ').length === 3, desk.galleryCols);
  assert('explore uses 4 columns on desktop', desk.discoverCols.split(' ').length === 4, desk.discoverCols);
  assert(
    'all six gallery tiles share one height',
    new Set(desk.galleryTileHeights).size === 1,
    desk.galleryTileHeights.join(', ')
  );
  assert('no oversized icons anywhere', desk.oversizedIcons.length === 0, String(desk.oversizedIcons));
  assert(
    'scroll reveals fire',
    desk.revealed >= desk.revealCount * 0.5,
    desk.revealed + ' / ' + desk.revealCount
  );

  // ---------- mobile ----------
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('http://localhost:4173', { waitUntil: 'networkidle' });

  const before = await m.evaluate(() => {
    const nav = document.querySelector('#nav').getBoundingClientRect();
    const art = document.querySelector('.hero-art').getBoundingClientRect();
    const lede = document.querySelector('.hero .lede').getBoundingClientRect();
    return {
      navVisible: getComputedStyle(document.querySelector('#nav')).visibility,
      navBottom: Math.round(nav.bottom),
      artTop: Math.round(art.top),
      artHeight: Math.round(art.height),
      ledeBottom: Math.round(lede.bottom),
      overflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  assert('mobile: menu hidden before opening', before.navVisible === 'hidden', before.navVisible);
  assert('mobile: no horizontal scroll', before.overflow === false, String(before.overflow));
  // the art is bottom-anchored; only its upper ~40% (sky) may sit behind the copy
  const buildingTop = before.artTop + before.artHeight * 0.4;
  assert(
    'mobile: hero copy clears the illustrated building',
    before.ledeBottom <= buildingTop,
    'lede ends ' + before.ledeBottom + ', building starts ' + Math.round(buildingTop)
  );

  await m.click('#navToggle');
  await m.waitForTimeout(500);
  const open = await m.evaluate(() => {
    const nav = document.querySelector('#nav').getBoundingClientRect();
    const brandEl = document.querySelector('.site-header .brand');
    const brand = brandEl.getBoundingClientRect();
    const hit = document.elementFromPoint(brand.x + 30, brand.y + 25);
    return {
      navTop: Math.round(nav.top),
      navBottom: Math.round(nav.bottom),
      brandCovered: hit === null || !brandEl.contains(hit),
      visibility: getComputedStyle(document.querySelector('#nav')).visibility,
      expanded: document.querySelector('#navToggle').getAttribute('aria-expanded')
    };
  });
  assert('mobile: menu spans below header to viewport bottom', open.navTop === 68 && open.navBottom === 844, `top ${open.navTop} bottom ${open.navBottom}`);
  assert('mobile: brand logo still visible when menu open', open.brandCovered === false, String(open.brandCovered));
  assert('mobile: menu state exposed to assistive tech', open.expanded === 'true' && open.visibility === 'visible', `${open.expanded}/${open.visibility}`);

  await m.click('.nav a[href="#aquatic"]');
  await m.waitForTimeout(1800);
  const afterNav = await m.evaluate(() => ({
    open: document.querySelector('#nav').classList.contains('open'),
    overflow: document.body.style.overflow,
    top: Math.round(document.querySelector('#aquatic').getBoundingClientRect().top)
  }));
  assert(
    'mobile: choosing a link closes the menu and scrolls there',
    !afterNav.open && !afterNav.overflow && afterNav.top >= 0 && afterNav.top < 120,
    JSON.stringify(afterNav)
  );

  // ---------- booking form ----------
  await d.evaluate(() => window.scrollTo(0, document.querySelector('#visit').offsetTop));
  await d.fill('input[name="name"]', 'Test Guest');
  await d.fill('input[name="contact"]', '0917 000 0000');
  await d.click('#bookForm button[type=submit]');
  await d.waitForTimeout(400);
  const note = await d.textContent('#formNote');
  assert('form confirms before opening messenger', /messenger|open/i.test(note), note.trim());

  await b.close();

  const failed = results.filter((r) => !r.pass);
  results.forEach((r) => console.log((r.pass ? '  PASS  ' : '  FAIL  ') + r.name + '  [' + r.detail + ']'));
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
  process.exit(failed.length ? 1 : 0);
})();
