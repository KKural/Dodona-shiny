const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const apps = [
    { name: 'app_anova', dir: 'shiny_apps/app_anova/static' },
    { name: 'app_correlatie_regressie', dir: 'shiny_apps/app_correlatie_regressie/static' },
    { name: 'app_meervoudige_regressie', dir: 'shiny_apps/app_meervoudige_regressie/static' },
    { name: 'app_meervoudige_regressie_interactie', dir: 'shiny_apps/app_meervoudige_regressie_interactie/static' },
    { name: 'app_partiele_correlatie', dir: 'shiny_apps/app_partiele_correlatie/static' },
    { name: 'app_hoofdstuk13', dir: 'shiny_apps/app_hoofdstuk13/static' },
    { name: 'app_hoofdstuk13_v3', dir: 'shiny_apps/app_hoofdstuk13_v3/static' }
  ];

  const browser = await chromium.launch({ headless: true });
  for (const app of apps) {
    const fileUrl = 'file:///' + path.join(root, app.dir, 'index.html').replace(/\\/g, '/');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => {
      const h = document.querySelector('.title-card h1, .title-card h1, h1');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return {
        clientWidth: h.clientWidth,
        scrollWidth: h.scrollWidth,
        right: r.right,
        left: r.left,
        text: h.textContent.trim()
      };
    });
    await ctx.close();
    console.log(`${app.name} | h1 ${m ? `${m.scrollWidth}/${m.clientWidth} right=${m.right}` : 'none'}`);
  }
  await browser.close();
})();
