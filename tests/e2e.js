/* Parcours navigateur (taille téléphone). Lancer un serveur : python3 -m http.server 8123, puis : node tests/e2e.js (Playwright requis) */
const { chromium } = require('playwright');
const assert = require('assert');
const URL = 'http://localhost:8123/index.html';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const width of [390, 360]) {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, locale: 'fr-FR', hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errors = [];
    p.on('pageerror', (e) => errors.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
    p.on('dialog', (d) => d.accept());
    const shot = (n) => p.screenshot({ path: `/tmp/forge-e2e-${width}-${n}.png` });
    const nav = async (r) => { await p.evaluate((r) => { location.hash = '#/' + r; }, r); await p.waitForTimeout(120); };
    await p.goto(URL); await p.waitForSelector('#tabs:not([hidden])');
    await p.evaluate(() => { S.profile.name = 'Test'; S.parks = [{ id: 'a', name: 'Parc', equip: ['barre','paralleles','banc','espalier','monkey','basse'], photo: null }]; S.parkLast = 'a'; TODAY_OVERRIDE = '2026-11-22'; saveState(); });
    // ---- A : dimanche, semaine en cours non générée, semaine prochaine prête
    await p.evaluate(() => { generateWeek('2026-11-23', ['2026-11-24', '2026-11-26', '2026-11-28']); }); await nav('today');
    let t = await p.innerText('#view'); console.log(width, 'A:', t.split('\n').filter((l) => /Prochaine/.test(l)).join(' / '));
    assert(t.includes('Prochaine séance : mardi – Tirage + muscle-up')); assert(!t.includes('Pas encore de semaine prévue'));
    await shot('A-today');
    assert(await p.locator('[data-a="strip-week"]').count() === 2);
    await p.click('[data-a="strip-week"][data-next="1"]'); assert.equal(await p.locator('.wd.ses').count(), 3); assert((await p.innerText('#view')).includes('Semaine du 23 novembre au 29 novembre'));
    await shot('A-next');
    // ---- B : jeudi, semaine en cours incomplète (dimanche seul)
    await p.evaluate(() => { S.weeks = {}; S.plans = {}; TODAY_OVERRIDE = '2026-11-19'; UI.stripNext = false; saveState(); });
    await nav('generer'); await shot('B-generer');
    const dis = await p.evaluate(() => [...document.querySelectorAll('[data-a="gen-day"]')].map((e) => e.disabled));
    assert.deepEqual(dis, [true, true, true, false, false, false, false]);
    await p.evaluate(() => { UI.genDays = []; UI.genTouched = true; render(); });
    await p.click('[data-a="gen-day"][data-d="2026-11-22"]'); await shot('B-dimanche-seul');
    assert((await p.innerText('#view')).includes('1/3 jour')); assert((await p.innerText('#view')).includes('Tirage + muscle-up'));
    await p.click('[data-a="gen-do"]'); await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => location.hash), '#/today');
    t = await p.innerText('#view'); assert(t.includes('Semaine du 16 novembre au 22 novembre prête'), 'bandeau prêt');
    assert.equal(await p.locator('.wd.ses').count(), 1); assert((await p.locator('.wd.ses').innerText()).includes('Tirage'));
    await shot('B-today-prete');
    // ---- C : deux jours consécutifs sam + dim, jeudi
    await p.evaluate(() => { S.weeks = {}; saveState(); }); await nav('bilan'); await nav('generer');
    await p.evaluate(() => { UI.genDays = []; UI.genTouched = true; render(); });
    await p.click('[data-a="gen-day"][data-d="2026-11-21"]'); await p.click('[data-a="gen-day"][data-d="2026-11-22"]');
    const pv = await p.innerText('#view'); assert(pv.includes('se suivent')); assert(pv.toLowerCase().includes('technique'));
    await p.click('[data-a="gen-do"]'); await p.waitForTimeout(100);
    assert.deepEqual(await p.evaluate(() => S.weeks['2026-11-16'].slots.map((s) => s.type)), ['S1', 'S3']);
    // ---- D : séance non prévue sans semaine
    await p.evaluate(() => { S.weeks = {}; S.sessions = []; saveState(); }); await nav('seance'); await nav('today');
    assert(await p.locator('[data-a="extra-ask"]').count() === 1);
    await p.click('[data-a="extra-ask"]'); await p.waitForTimeout(100); await shot('D-extra');
    assert((await p.innerText('#sheet-box')).includes('Tirage + muscle-up'));
    await p.click('[data-a="close-sheet"]:has-text("Annuler")');
    // ---- E : séance faite hors app (hier, séance poussée)
    await nav('seance'); await p.click('[data-a="off-open"]'); await p.waitForTimeout(100);
    await p.fill('#off-d', '2026-11-18'); await p.locator('#off-d').dispatchEvent('change'); await p.waitForTimeout(100);
    await p.click('[data-a="off-type"][data-type="S2"]'); await shot('E-horsapp');
    await p.fill('[data-off="v"][data-i="0"][data-j="0"]', '9'); await p.fill('[data-off="v"][data-i="0"][data-j="1"]', '9'); await p.fill('[data-off="v"][data-i="0"][data-j="2"]', '8');
    await p.click('[data-a="off-addset"][data-i="0"]'); assert.equal(await p.inputValue('[data-off="v"][data-i="0"][data-j="0"]'), '9', 'saisie conservée');
    await p.fill('[data-off="v"][data-i="1"][data-j="0"]', '12');
    await p.selectOption('#off-ex', 'pompes'); await p.click('[data-a="off-addex"]');
    const last = await p.evaluate(() => UI.off.items.length - 1); await p.fill(`[data-off="v"][data-i="${last}"][data-j="0"]`, '25');
    await p.click('[data-a="off-save"]'); await p.waitForSelector('[data-a="off-done"]'); await shot('E-resultat');
    const st = await p.evaluate(() => ({ n: S.sessions.length, d: S.sessions[0].d, ty: S.sessions[0].type, items: S.sessions[0].items.map((i) => i.exId + ':' + i.sets.map((s) => s.r).join('/')), rec: bestRecord('dips'), pompes: bestRecord('pompes'), dayCount: distinctDaysInWeek('2026-11-16') }));
    console.log(width, 'E:', JSON.stringify(st)); assert.equal(st.n, 1); assert.equal(st.d, '2026-11-18'); assert.equal(st.rec, 9); assert.equal(st.pompes, 25); assert.equal(st.dayCount, 1);
    await p.click('[data-a="off-done"]');
    await nav('bilan'); assert((await p.innerText('#view')).includes('1/3'));
    // ---- F : sans débordement
    for (const r of ['today', 'seance', 'generer', 'horsapp', 'bilan']) { await nav(r); const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) console.log('DEBORDE', r, o); }
    console.log(width, 'ERRORS', errors); await ctx.close();
  }
  await b.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
