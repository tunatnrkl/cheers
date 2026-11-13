// Belge ekran görüntüleri: kurulum, masa, rakip aksiyonu sırasında, sonuç, koç açık (390x844 ve 1440x900).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3212';
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const [ad, w, h] of [['mobil-390x844', 390, 844], ['masaustu-1440x900', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => { try { localStorage.setItem('pd:rhythm', '0'); } catch {} });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/alistirma`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${ad}-1-kurulum.png` });
    await p.goto(`${BASE}/alistirma?el=c29`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/${ad}-2-masa.png` });
    // Koç açık: pot odds sorusu
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    await p.getByRole('dialog', { name: 'Koç' }).getByRole('button', { name: 'Pot odds nedir?' }).click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/${ad}-5-koc-acik.png` });
    await p.getByRole('button', { name: 'Koç penceresini küçült' }).click();
    // Rakip aksiyonu sırasında
    await p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^(Check|Call)/ }).first().click();
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${OUT}/${ad}-3-rakip-aksiyonu.png` });
    for (let i = 0; i < 10; i++) {
      if (await p.getByRole('button', { name: /^Sonraki el/ }).count()) break;
      await p.waitForFunction(() => [...document.querySelectorAll('[role=region][aria-label=Aksiyonlar] button')].some((x) => (/^(Check|Call)/.test(x.textContent) && !x.disabled) || /^Sonraki el/.test(x.textContent)), null, { timeout: 30000 });
      if (await p.getByRole('button', { name: /^Sonraki el/ }).count()) break;
      await p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^(Check|Call)/ }).first().click();
    }
    await p.getByRole('button', { name: /^Sonraki el/ }).waitFor({ timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${ad}-4-sonuc.png` });
    await ctx.close();
  }
  await b.close();
})();
