const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const apps = [
    { name: 'app_correlatie_regressie', dir: 'shiny_apps/app_correlatie_regressie/static' },
    { name: 'app_meervoudige_regressie', dir: 'shiny_apps/app_meervoudige_regressie/static' },
    { name: 'app_meervoudige_regressie_interactie', dir: 'shiny_apps/app_meervoudige_regressie_interactie/static' },
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
    const data = await page.evaluate(() => {
      const vp = window.innerWidth;
      const offenders = [];
      const all = Array.from(document.querySelectorAll('body *'));
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > vp + 1) {
          const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().replace(/\s+/g, '.') : '';
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls,
            right: Number(r.right.toFixed(1)),
            width: Number(r.width.toFixed(1)),
            text: (el.textContent || '').trim().slice(0, 80)
          });
        }
      }
      offenders.sort((a,b)=>b.right-a.right);
      return { vp, top: offenders.slice(0, 8) };
    });
    console.log('\n' + app.name + ' viewport=' + data.vp);
    for (const o of data.top) {
      console.log(`  ${o.tag}${o.cls} right=${o.right} width=${o.width} text="${o.text.replace(/\s+/g,' ')}"`);
    }
    await ctx.close();
  }
  await browser.close();
})();
