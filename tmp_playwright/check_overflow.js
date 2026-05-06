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

    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktop = await desktopCtx.newPage();
    await desktop.goto(fileUrl, { waitUntil: 'load' });
    await desktop.waitForTimeout(800);
    const dMetrics = await desktop.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body ? document.body.scrollWidth : null
    }));
    await desktopCtx.close();

    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mobile = await mobileCtx.newPage();
    await mobile.goto(fileUrl, { waitUntil: 'load' });
    await mobile.waitForTimeout(800);
    const mMetrics = await mobile.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body ? document.body.scrollWidth : null
    }));
    await mobileCtx.close();

    console.log(`${app.name} | desktop ${dMetrics.scrollWidth}/${dMetrics.clientWidth} | mobile ${mMetrics.scrollWidth}/${mMetrics.clientWidth}`);
  }

  await browser.close();
})();
