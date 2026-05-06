const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = process.cwd();
  const apps = [
    { name: 'app_anova', dir: 'shiny_apps/app_anova/static' },
    { name: 'app_correlatie_regressie', dir: 'shiny_apps/app_correlatie_regressie/static' },
    { name: 'app_meervoudige_regressie', dir: 'shiny_apps/app_meervoudige_regressie/static' },
    { name: 'app_meervoudige_regressie_interactie', dir: 'shiny_apps/app_meervoudige_regressie_interactie/static' },
    { name: 'app_partiele_correlatie', dir: 'shiny_apps/app_partiele_correlatie/static' },
    { name: 'app_hoofdstuk13', dir: 'shiny_apps/app_hoofdstuk13/static' },
    { name: 'app_hoofdstuk13_v3', dir: 'shiny_apps/app_hoofdstuk13_v3/static' }
  ];

  const outDir = path.join(root, 'tmp_ui_audit');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const app of apps) {
    const appOut = path.join(outDir, app.name);
    fs.mkdirSync(appOut, { recursive: true });

    const fileUrl = 'file:///' + path.join(root, app.dir, 'index.html').replace(/\\/g, '/');

    // Desktop
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(fileUrl, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(appOut, 'desktop.png'), fullPage: false });
      await context.close();
    }

    // Mobile default
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(fileUrl, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(appOut, 'mobile.png'), fullPage: false });

      // Mobile with sidebar opened if toggle exists
      const toggle = page.locator('#btn-sidebar-toggle');
      if (await toggle.count() > 0) {
        await toggle.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(appOut, 'mobile_sidebar_open.png'), fullPage: false });
      }

      await context.close();
    }
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
})();
