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
      const vp = window.innerWidth;
      const main = document.querySelector('.main-content, .main');
      const sidebar = document.querySelector('.sidebar');
      const layout = document.querySelector('.layout');
      const rect = main ? main.getBoundingClientRect() : null;
      const srect = sidebar ? sidebar.getBoundingClientRect() : null;
      const lrect = layout ? layout.getBoundingClientRect() : null;
      return {
        vp,
        mainWidth: rect ? rect.width : null,
        mainRight: rect ? rect.right : null,
        sidebarWidth: srect ? srect.width : null,
        sidebarLeft: srect ? srect.left : null,
        layoutWidth: lrect ? lrect.width : null,
        layoutRight: lrect ? lrect.right : null
      };
    });
    await ctx.close();
    console.log(`${app.name} | vp=${m.vp} main=${m.mainWidth}/${m.mainRight} layout=${m.layoutWidth}/${m.layoutRight} sidebar=${m.sidebarWidth}@${m.sidebarLeft}`);
  }
  await browser.close();
})();
