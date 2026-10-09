import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const base=process.env.SITE_URL||'http://127.0.0.1:4173/';
await mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(existsSync('/Users/modernapex/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')?'/Users/modernapex/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell':undefined)});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];const broken=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)broken.push(r.status()+' '+r.url());});
try{
  await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.card').count(),30);
  for(const [category,count] of [['Sweats',5],['Tees',6],['Hats',5],['Accessories',12],['Onesies',1],['Holiday',15],['Fan lab',9],['Archive',20],['Carryover',18],['All',48]]){await page.locator(`[data-filter="${category}"]`).click();assert.equal(await page.locator('.card').count(),count);}
  await page.locator('#search').fill('no-such-design-xyz');assert.equal(await page.locator('.card').count(),0);assert.ok(await page.locator('#empty-state').isVisible());await page.locator('#reset-filter').click();
  await page.locator('#search').fill('context');assert.ok(await page.locator('.card').count()>0);await page.locator('#search').fill('');
  await page.locator('[data-save="who-dis-tee"]').first().click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#save-count').textContent(),'1');assert.ok((await page.locator('#review-summary').textContent()).includes('1 keeper. 47'));const brief=await page.locator('#decision-brief').inputValue();assert.ok(brief.includes('KEEP (1)')&&brief.includes('REPLACE (47)'));await page.locator('[data-filter="Replace"]').click();assert.equal(await page.locator('.card').count(),47);assert.equal(await page.locator('.is-keeper').count(),0);await page.locator('[data-filter="All"]').click();
  await page.locator('[data-open="off-duty-onesie"]').first().click();assert.ok(page.url().includes('design=off-duty-onesie'));await page.locator('#dialog-save').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#product-dialog').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.open),'off-duty-onesie');
  await page.locator('#preferred-size').selectOption('L');await page.locator('#shortlist-note').fill('A heavier zipper & deep pockets, please.');const mail=decodeURIComponent(await page.locator('#email-shortlist').getAttribute('href'));assert.ok(mail.includes('Witness Protection')&&mail.includes('Forced to Relax')&&mail.includes('Preferred clothing size: L')&&mail.includes('heavier zipper & deep pockets'));
  await page.locator('#show-saved').click();assert.equal(await page.locator('.card').count(),2);await page.locator('[data-filter="All"]').click();
  for(const img of await page.locator('.card-image img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
  await page.locator('.editorial-image img').scrollIntoViewIfNeeded();await page.locator('.editorial-image img').evaluate(i=>i.decode());
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'qa/prompt-desktop.png'});await page.screenshot({path:'qa/prompt-desktop-full.png',fullPage:true});
  for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Home fits '+width);if(width===390){await page.screenshot({path:'qa/prompt-mobile.png'});await page.locator('[data-open="clawd-timeout"]').first().click();assert.ok((await page.locator('#dialog-note').textContent()).includes('Permission'));assert.equal(await page.locator('#product-dialog').evaluate(d=>d.scrollWidth>d.clientWidth),false);await page.screenshot({path:'qa/prompt-dialog-mobile.png'});await page.keyboard.press('Escape');}}
  await page.goto(new URL('?design=empty-meter-keychain',base).href);assert.ok((await page.locator('#dialog-note').textContent()).includes('Native Blender'));await page.keyboard.press('Escape');
  await page.goto(new URL('?design=pair-programming',base).href,{waitUntil:'networkidle'});assert.equal(await page.locator('.card').count(),30);assert.equal(await page.locator('#dialog-title').textContent(),'North Pole pair programming');
  assert.deepEqual(errors,[],'No browser exceptions');assert.deepEqual(broken,[],'No failed resources');
  console.log(`PASS: 48 current designs, 20 archived concepts, category and round filters, search, persistent favorites, modal keyboard/focus, shortlist mailto, exact/legacy links, all image decoding, mobile layouts and no browser errors.`);
}finally{await browser.close();}
