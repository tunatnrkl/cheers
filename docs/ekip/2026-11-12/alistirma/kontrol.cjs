// Alıştırma ekranı kontrolleri: (a) kayma/görünürlük, (b) 20 spot uçtan uca, (c) sızıntı, (d) koç penceresi, (e) diğer sayfalar.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:3212';
const SHOTS = process.env.SHOTS; // ekran görüntüsü klasörü (isteğe bağlı)
const SIZES = [[1440, 900], [1280, 720], [1024, 768], [768, 1024], [390, 844], [360, 640], [844, 390]];
const SPOTS = ['c26', 'c19', 'c24', 'c29', 'c33', 'c36', 'c10', 'c11', 'c01', 't13', 't23', 't25', 't26',
  'o-Qc4c-3cTh7h8c', 'o-3s8c-Jc7c5hJs', 'o-5c7h-Ts3hThQh', 'o-7hAc-QsTc9c8d', 'o-3hAd-8dTs8sKd', 'o-QhKc-6cAh7hJc', 'o-6d9h-3d4d2c3c'];
const SUIT = { s: 'maça', h: 'kupa', d: 'karo', c: 'sinek' };
const RANK = { A: 'as', K: 'papaz', Q: 'kız', J: 'vale', T: '10' };
const adi = (c) => `${SUIT[c[1]]} ${RANK[c[0]] ?? c[0]}`;
const sonuc = { a: [], b: [], c: [], d: [], e: [] };
let hata = 0;
const yaz = (k, ok, msg) => { sonuc[k].push(`${ok ? 'GEÇTİ' : 'KALDI'} ${msg}`); if (!ok) hata++; };

async function sayfa(b, w, h, hiz = 'aninda') {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((hiz) => { try { localStorage.setItem('cheers:alistirma-ayar:v1', JSON.stringify({ hiz })); localStorage.setItem('pd:rhythm', '0'); } catch {} }, hiz);
  const p = await ctx.newPage();
  p.errs = [];
  p.on('console', (m) => { if (m.type() === 'error') p.errs.push(m.text()); });
  p.on('pageerror', (e) => p.errs.push(String(e)));
  return p;
}
const kayma = (p) => p.evaluate(() => { const s = document.scrollingElement; return { sh: s.scrollHeight, ch: s.clientHeight }; });
async function gorunur(p, loc) {
  const vp = p.viewportSize();
  const bb = await loc.boundingBox();
  return !!bb && bb.y >= 0 && bb.x >= 0 && bb.y + bb.height <= vp.height + 0.5 && bb.x + bb.width <= vp.width + 0.5;
}
const aksiyonBtn = (p) => p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^(Fold|Check|Call|Bet|Raise|All-in)/ });

async function snap(p) {
  return p.evaluate(() => {
    const parts = [document.body.innerText];
    for (const el of document.querySelectorAll('*')) {
      for (const a of el.attributes) if (a.name === 'aria-label' || a.name === 'title' || a.name === 'alt' || a.name.startsWith('data-') || a.name === 'value') parts.push(a.value);
      if (el instanceof HTMLInputElement) parts.push(el.value);
    }
    return parts.join('\n');
  });
}

(async () => {
  const b = await chromium.launch();

  // (a) Boyutlar
  for (const [w, h] of process.env.SADECE ? [] : SIZES) {
    const p = await sayfa(b, w, h);
    await p.goto(`${BASE}/alistirma`, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'ANTRENMANA BAŞLA' }).waitFor();
    let k = await kayma(p);
    const basla = await gorunur(p, p.getByRole('button', { name: 'ANTRENMANA BAŞLA' }));
    yaz('a', k.sh <= k.ch && basla, `${w}x${h} kurulum: scrollHeight ${k.sh} / clientHeight ${k.ch}, başla butonu görünür: ${basla}`);
    if (SHOTS && ((w === 390 && h === 844) || (w === 1440 && h === 900))) await p.screenshot({ path: `${SHOTS}/${w}x${h}-1-kurulum.png` });
    await p.getByRole('button', { name: 'ANTRENMANA BAŞLA' }).click();
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    await p.waitForTimeout(400);
    k = await kayma(p);
    const btns = aksiyonBtn(p);
    const n = await btns.count();
    let hepsi = n > 0;
    for (let i = 0; i < n; i++) hepsi = hepsi && (await gorunur(p, btns.nth(i)));
    const kart = await gorunur(p, p.getByRole('group', { name: 'Senin kartların' }));
    yaz('a', k.sh <= k.ch && hepsi && kart, `${w}x${h} masa: scrollHeight ${k.sh} / clientHeight ${k.ch}, ${n} aksiyon butonu görünür: ${hepsi}, hero kartları görünür: ${kart}`);
    // Koç açıkken de
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    await p.getByRole('dialog', { name: 'Koç' }).waitFor();
    k = await kayma(p);
    const kb = await p.getByRole('dialog', { name: 'Koç' }).boundingBox();
    const ab = await p.getByRole('region', { name: 'Aksiyonlar' }).boundingBox();
    const ortusmez = kb.y + kb.height <= ab.y + 0.5;
    const yarim = kb.height < h / 2;
    hepsi = true;
    for (let i = 0; i < n; i++) hepsi = hepsi && (await gorunur(p, btns.nth(i)));
    yaz('a', k.sh <= k.ch && ortusmez && hepsi, `${w}x${h} koç açık: kayma yok ${k.sh <= k.ch}, aksiyon çubuğunu örtmüyor ${ortusmez}, butonlar görünür ${hepsi}, yükseklik ${Math.round(kb.height)}px (ekranın yarısından az: ${yarim})`);
    if (SHOTS && ((w === 390 && h === 844) || (w === 1440 && h === 900))) {
      await p.getByRole('button', { name: 'Pot odds nedir?' }).click();
      await p.waitForTimeout(300);
      await p.screenshot({ path: `${SHOTS}/${w}x${h}-5-koc-acik.png` });
    }
    if (p.errs.length) yaz('a', false, `${w}x${h} konsol hatası: ${p.errs.slice(0, 3).join(' | ')}`);
    await p.context().close();
  }

  // (b) + (c) 20 spot, pasif hatla sona kadar; el sırasında anlık görüntüler
  for (const id of process.env.SADECE ? [] : SPOTS) {
    const p = await sayfa(b, 1280, 720);
    await p.goto(`${BASE}/alistirma?el=${encodeURIComponent(id)}`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    const snaps = [];
    let adim = 0;
    let sondaSokak = '';
    // ilk kararda koçun hazır sorularını da sor (yanıtlar sızıntı taramasına girer)
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    for (const q of ['Pot odds nedir?', "Bu board'da planım ne olmalı?"]) await p.getByRole('button', { name: q }).click();
    for (; adim < 12; adim++) {
      const bitti = await p.getByRole('button', { name: /^Sonraki el/ }).count();
      if (bitti) break;
      await p.waitForFunction(() => [...document.querySelectorAll('[role=region][aria-label=Aksiyonlar] button')].some((x) => /^(Check|Call)/.test(x.textContent) && !x.disabled), null, { timeout: 15000 });
      snaps.push(await snap(p));
      const btn = p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^(Check|Call)/ });
      await btn.first().click();
      await p.getByRole('button', { name: 'Neden?' }).last().click().catch(() => {});
      await p.waitForTimeout(150);
      // Yalnızca el bitmemişse (Sonraki el butonu yoksa) kaydedilir
      if (!(await p.getByRole('button', { name: /^Sonraki el/ }).count())) snaps.push(await snap(p));
    }
    await p.getByRole('button', { name: /^Sonraki el/ }).waitFor({ timeout: 15000 });
    const ozet = await p.getByRole('region', { name: 'El özeti' }).innerText().catch(async () => (await p.locator('#el-sonu-baslik').locator('xpath=../..').innerText()));
    sondaSokak = (ozet.match(/Showdown|Fold|fold etti|Rakipler fold/) || ['?'])[0];
    // Showdown'da açılan rakip kartları (hero hariç)
    const heroKart = await p.getByRole('group', { name: 'Senin kartların' }).getByRole('img').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    const sd = await p.evaluate(() => {
      const h = [...document.querySelectorAll('h3')].find((x) => x.textContent === 'Showdown');
      return h ? [...h.parentElement.querySelectorAll('[role=img]')].map((e) => e.getAttribute('aria-label')) : [];
    });
    const rakip = sd.filter((x) => !heroKart.includes(x));
    let sizinti = [];
    for (const s of snaps) for (const c of rakip) if (s.includes(c)) sizinti.push(c);
    sizinti = [...new Set(sizinti)];
    yaz('b', p.errs.length === 0, `${id}: ${adim} karar, sonuç: ${ozet.split('\n').find((l) => /Showdown|Fold|fold|kazandı|aldın|oynatılmadı/.test(l)) ?? '?'}; konsol hatası: ${p.errs.length}`);
    yaz('c', sizinti.length === 0, `${id}: showdown'da açılan rakip kartı ${rakip.length} (${rakip.join(', ') || 'showdown yok'}); el bitmeden ${snaps.length} anlık görüntüde bulunan: ${sizinti.join(', ') || 'yok'}`);
    if (SHOTS && id === 'c26') await p.screenshot({ path: `${SHOTS}/1280x720-sonuc.png` });
    await p.context().close();
  }

  // (c2) Normal hızda oynatma sırasında sık anlık görüntü: rakip kartı showdown gösterilene kadar yok
  for (const id of ['c29', 'c24', 'c10', 'o-7hAc-QsTc9c8d', 't25']) {
    const p = await sayfa(b, 1280, 720, 'normal');
    await p.goto(`${BASE}/alistirma?el=${encodeURIComponent(id)}`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    const snaps = [];
    let sdOnce = 0;
    const t0 = Date.now();
    for (let t = 0; Date.now() - t0 < 120000; t++) {
      if (await p.getByRole('button', { name: /^Sonraki el/ }).count()) break;
      const sdVar = await p.locator('.kart-sd').count();
      if (!sdVar) snaps.push(await snap(p)); else sdOnce++;
      const btn = p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^(Check|Call)/ }).first();
      if ((await btn.count()) && (await btn.isEnabled({ timeout: 500 }).catch(() => false))) await p.keyboard.press('c'); // klavye kısayolu
      await p.waitForTimeout(120);
    }
    await p.getByRole('button', { name: /^Sonraki el/ }).waitFor({ timeout: 30000 });
    const heroKart = await p.getByRole('group', { name: 'Senin kartların' }).getByRole('img').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    const sd = await p.evaluate(() => {
      const h = [...document.querySelectorAll('h3')].find((x) => x.textContent === 'Showdown');
      return h ? [...h.parentElement.querySelectorAll('[role=img]')].map((e) => e.getAttribute('aria-label')) : [];
    });
    const rakip = sd.filter((x) => !heroKart.includes(x));
    const siz = [...new Set(snaps.flatMap((s) => rakip.filter((c) => s.includes(c))))];
    yaz('c', siz.length === 0 && p.errs.length === 0, `${id} (Normal hız, C tuşuyla): oynatma boyunca ${snaps.length} anlık görüntü (showdown öncesi); rakip kartları (${rakip.join(', ') || 'yok'}) bulunmadı: ${siz.length === 0}; konsol hatası ${p.errs.length}`);
    await p.context().close();
  }

  // (b2) Hero fold: çok oyunculu potta "El oynatılmadı", kalan board yalnızca board
  for (const id of ['c29', 'c26']) {
    const p = await sayfa(b, 1280, 720);
    await p.goto(`${BASE}/alistirma?el=${id}`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    // Önünde bahis olunca fold, yoksa check
    for (let i = 0; i < 8 && !(await p.getByRole('button', { name: /^Sonraki el/ }).count()); i++) {
      await p.waitForFunction(() => [...document.querySelectorAll('[role=region][aria-label=Aksiyonlar] button')].some((x) => (/^(Check|Call|Fold)/.test(x.textContent) && !x.disabled) || /^Sonraki el/.test(x.textContent)), null, { timeout: 15000 });
      const fold = p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^Fold/ });
      if (await fold.count()) await fold.click();
      else if (await p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^Check/ }).count())
        await p.getByRole('region', { name: 'Aksiyonlar' }).getByRole('button', { name: /^Check/ }).click();
      await p.waitForTimeout(100);
    }
    await p.getByRole('button', { name: /^Sonraki el/ }).waitFor();
    const metin = await p.locator('#el-sonu-baslik').locator('xpath=../..').innerText();
    const kb = p.getByRole('button', { name: 'Kartlar nasıl gelecekti?' });
    const varmi = await kb.count();
    if (varmi) await kb.click();
    const kalan = await p.getByRole('group', { name: 'Elin devamında açılacak board' }).getByRole('img').count().catch(() => 0);
    const sdYok = (await p.locator('.kart-sd').count()) === 0;
    yaz('b', varmi > 0 && kalan === 5 && sdYok && (id !== 'c29' || /El oynatılmadı/.test(metin)),
      `${id} fold: ${metin.split('\n').find((l) => /El oynatılmadı|Fold ettin|aldı/.test(l))}; "Kartlar nasıl gelecekti?" ${varmi ? 'var' : 'yok'}, kalan board ${kalan} kart, rakip kartı açılmadı ${sdYok}`);
    await p.context().close();
  }

  // (d) Koç küçült/aç
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await sayfa(b, w, h);
    await p.goto(`${BASE}/alistirma?el=c26`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    const dlg = p.getByRole('dialog', { name: 'Koç' });
    for (const q of ['Pot odds nedir?', "Bu board'da planım ne olmalı?", 'Neden?']) await dlg.getByRole('button', { name: q }).click();
    await p.locator('#koc-soru').fill('yarım kalan soru');
    await p.evaluate(() => { const l = document.querySelector('.koc-liste'); l.scrollTop = 40; });
    const once = { n: await dlg.locator('.koc-liste > *').count(), sc: await p.evaluate(() => document.querySelector('.koc-liste').scrollTop) };
    await dlg.getByRole('button', { name: 'Koç penceresini küçült' }).click();
    const gizli = await dlg.isHidden();
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    await p.waitForTimeout(100);
    const sonra = { n: await dlg.locator('.koc-liste > *').count(), sc: await p.evaluate(() => document.querySelector('.koc-liste').scrollTop), v: await p.locator('#koc-soru').inputValue() };
    const kb = await dlg.boundingBox();
    const ab = await p.getByRole('region', { name: 'Aksiyonlar' }).boundingBox();
    yaz('d', gizli && once.n === sonra.n && sonra.v === 'yarım kalan soru' && Math.abs(once.sc - sonra.sc) <= 2 && kb.y + kb.height <= ab.y,
      `${w}x${h}: küçültünce gizlendi ${gizli}; mesaj ${once.n}→${sonra.n}; yazı korunuyor "${sonra.v}"; kaydırma ${once.sc}→${sonra.sc}; aksiyon çubuğunu örtmüyor ${kb.y + kb.height <= ab.y}`);
    // Esc küçültür; serbest soru
    await p.locator('#koc-soru').fill('serbest bir soru');
    await p.locator('#koc-soru').press('Enter');
    const serbest = await dlg.innerText();
    yaz('d', /hazır sorularla çalışır/.test(serbest) && !/yapay zeka/i.test(serbest), `${w}x${h}: serbest soruya "hazır sorularla çalışır" yanıtı; pencerede "yapay zeka" geçmiyor`);
    await p.locator('#koc-soru').press('Escape');
    yaz('d', await dlg.isHidden(), `${w}x${h}: Esc pencereyi küçültür`);
    // Sayfa yenilenince (oturum) aynı hâl
    await p.getByRole('button', { name: /Koç penceresini aç/ }).click();
    await p.reload({ waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    await p.waitForTimeout(300);
    const n2 = await p.getByRole('dialog', { name: 'Koç' }).locator('.koc-liste > *').count();
    yaz('d', (await p.getByRole('dialog', { name: 'Koç' }).isVisible()) && n2 >= once.n, `${w}x${h}: yenilemeden sonra pencere açık ve ${n2} mesaj korunuyor (sessionStorage)`);
    await p.context().close();
  }

  // (e) Diğer sayfalar normal kayar; alıştırmadan çıkınca kilit kalkar
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await sayfa(b, w, h);
    for (const yol of ['/', '/range']) {
      await p.goto(`${BASE}${yol}`, { waitUntil: 'networkidle' });
      const k = await kayma(p);
      await p.mouse.wheel(0, 600);
      await p.waitForTimeout(400);
      const y = await p.evaluate(() => scrollY);
      yaz('e', k.sh > k.ch && y > 0, `${w}x${h} ${yol}: scrollHeight ${k.sh} > clientHeight ${k.ch}, tekerlekle kaydı (scrollY ${y})`);
    }
    await p.goto(`${BASE}/alistirma?el=c26`, { waitUntil: 'networkidle' });
    await p.getByRole('group', { name: 'Senin kartların' }).waitFor();
    await p.getByRole('link', { name: 'Range' }).first().click();
    await p.waitForURL(/\/range/);
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => ({ html: document.documentElement.style.overflow, body: document.body.style.overflow, footer: getComputedStyle(document.querySelector('body > footer')).display }));
    await p.mouse.wheel(0, 600);
    await p.waitForTimeout(400);
    const y = await p.evaluate(() => scrollY);
    yaz('e', !st.html && !st.body && st.footer !== 'none' && y > 0, `${w}x${h} /alistirma → /range (istemci geçişi): kilit kaldırıldı (html "${st.html}", body "${st.body}", footer ${st.footer}), scrollY ${y}`);
    await p.context().close();
  }

  await b.close();
  for (const k of Object.keys(sonuc)) { console.log(`\n(${k})`); for (const l of sonuc[k]) console.log('  ' + l); }
  console.log(`\nToplam başarısız: ${hata}`);
  process.exit(hata ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
