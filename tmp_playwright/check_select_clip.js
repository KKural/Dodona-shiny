const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const apps = [
    { name: 'app_anova', dir: 'shiny_apps/app_anova/static', sel: '#sel-scenario' },
    { name: 'app_correlatie_regressie', dir: 'shiny_apps/app_correlatie_regressie/static', sel: '#scenario' },
    { name: 'app_meervoudige_regressie', dir: 'shiny_apps/app_meervoudige_regressie/static', sel: '#scenario' },
    { name: 'app_meervoudige_regressie_interactie', dir: 'shiny_apps/app_meervoudige_regressie_interactie/static', sel: '#scenario' },
    { name: 'app_partiele_correlatie', dir: 'shiny_apps/app_partiele_correlatie/static', sel: '#scenario' },
    { name: 'app_hoofdstuk13', dir: 'shiny_apps/app_hoofdstuk13/static', sel: '#scenario' },
    { name: 'app_hoofdstuk13_v3', dir: 'shiny_apps/app_hoofdstuk13_v3/static', sel: '#scenario' }
  ];

  const browser = await chromium.launch({ headless: true });
  for (const app of apps) {
    const fileUrl = 'file:///' + path.join(root, app.dir, 'index.html').replace(/\\/g, '/');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const m = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        right: r.right,
        viewport: window.innerWidth,
        value: el.value,
        selectedText: el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : null
      };
    }, app.sel);
    await ctx.close();
    if (!m) {
      console.log(`${app.name} | no select`);
    } else {
      console.log(`${app.name} | select ${m.scrollWidth}/${m.clientWidth} right=${m.right} vp=${m.viewport} textLen=${(m.selectedText||'').length}`);
    }
  }
  await browser.close();
})();
