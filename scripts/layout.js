/* Report computed layout geometry for every major grid/section. */
const { chromium } = require('playwright');

const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 }
];

(async () => {
  const b = await chromium.launch();

  for (const v of views) {
    const p = await b.newPage({ viewport: { width: v.width, height: v.height } });
    await p.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '*{transition:none!important} .reveal{opacity:1!important;transform:none!important}' });

    const report = await p.evaluate(() => {
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
      };
      const grid = (sel) => {
        const items = [...document.querySelectorAll(sel)];
        if (!items.length) return null;
        const rows = {};
        items.forEach((el) => {
          const b = box(el);
          (rows[b.y] = rows[b.y] || []).push(b.x + '/' + b.w);
        });
        return {
          columns: getComputedStyle(items[0].parentElement).gridTemplateColumns,
          rows: Object.entries(rows).map(([y, cells]) => `y=${y}: ${cells.join('  ')}`)
        };
      };
      const overflow = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
        })
        .slice(0, 12)
        .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);

      return {
        docWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        rooms: grid('.room'),
        facilities: grid('.facility'),
        pools: grid('.pool-card'),
        discover: grid('.discover-card'),
        gallery: grid('.tile'),
        footerCols: grid('.footer-col'),
        sections: [...document.querySelectorAll('main section')].map((s) => (s.id || '?') + ':' + box(s).h),
        heroHeight: box(document.querySelector('.hero')).h,
        overflowing: overflow
      };
    });

    console.log('\n=== ' + v.name + ' (' + v.width + 'px) ===');
    console.log('doc scrollWidth:', report.docWidth, '| viewport:', report.viewportWidth,
      '| horizontal overflow:', report.docWidth > report.viewportWidth ? 'YES ***' : 'none');
    console.log('hero height:', report.heroHeight);
    console.log('sections:', report.sections.join(' '));
    ['rooms', 'facilities', 'pools', 'discover', 'gallery', 'footerCols'].forEach((k) => {
      const g = report[k];
      if (!g) return;
      console.log(k, '| cols:', g.columns);
      g.rows.forEach((r) => console.log('   ', r));
    });
    if (report.overflowing.length) console.log('OVERFLOWING ELEMENTS:', report.overflowing);
    await p.close();
  }
  await b.close();
})();
