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
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const h1 = document.querySelector('.title-card h1, .title-card h1, h1');
      const rect = h1 ? h1.getBoundingClientRect() : null;
      const style = h1 ? getComputedStyle(h1) : null;
      return {
        viewport: window.innerWidth,
        h1Text: h1 ? h1.textContent.trim() : null,
        h1Right: rect ? rect.right : null,
        h1Width: rect ? rect.width : null,
        h1WhiteSpace: style ? style.whiteSpace : null,
        h1Overflow: style ? style.overflow : null,
        h1TextOverflow: style ? style.textOverflow : null
      };
    });
    await ctx.close();
    console.log(`${app.name} | h1Right=${m.h1Right} viewport=${m.viewport} whiteSpace=${m.h1WhiteSpace} overflow=${m.h1Overflow} textOverflow=${m.h1TextOverflow}`);
  }

  await browser.close();
})();
