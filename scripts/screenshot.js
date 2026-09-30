/* Capture screenshots of the local site at three viewports.
   Run: npm run screenshots   (requires `npm start` in another terminal) */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = path.join(__dirname, '..', 'shots');
const fs = require('fs');

// Freeze animations/transitions so captures are deterministic.
const FREEZE =
  '*{transition:none !important;animation:none !important} ' +
  '.reveal{opacity:1 !important;transform:none !important} ' +
  'html{scroll-behavior:auto !important}';

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 }
];

const SECTIONS = ['about', 'stay', 'aquatic', 'facilities', 'events', 'explore', 'gallery', 'visit'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const view of VIEWS) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height } });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
    await page.addStyleTag({ content: FREEZE });
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(OUT, `${view.name}-full.png`), fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `${view.name}-hero.png`) });

    if (view.name === 'desktop') {
      for (const id of SECTIONS) {
        const el = await page.$('#' + id);
        if (!el) continue;
        const y = await el.evaluate(
          (n) => n.getBoundingClientRect().top + window.scrollY - 76
        );
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT, `desktop-${id}.png`) });
      }
    }

    if (view.name === 'mobile') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#navToggle');
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(OUT, 'mobile-menu.png') });
      await page.click('#navToggle');
    }

    await page.close();
    console.log('captured', view.name);
  }

  await browser.close();
  console.log('done ->', OUT);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
