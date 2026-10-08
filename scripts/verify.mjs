import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base=process.env.SITE_URL||'http://127.0.0.1:4173/';
await mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];const broken=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)broken.push(r.status()+' '+r.url());});
try{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.product').count(),10,'Ten designs render');
  for(const [filter,count] of [['Claude',4],['Codex',4],['Originals',3],['All',10]]){
    await page.locator(`[data-filter="${filter}"]`).click();
    assert.equal(await page.locator('.product').count(),count,filter+' filter count');
  }
  await page.locator('[data-save="claude-claus"]').first().click();
  assert.equal(await page.locator('#save-count').textContent(),'1');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#save-count').textContent(),'1','Favorite survives reload');
  await page.locator('[data-open="codex-midnight"]').first().click();
  assert.equal(await page.locator('#dialog-title').textContent(),'Ship the gifts');
  assert.equal(await page.locator('#product-dialog').evaluate(d=>d.open),true);
  assert.ok(page.url().includes('design=codex-midnight'));
  await page.locator('#dialog-save').click();
  assert.equal(await page.locator('#save-count').textContent(),'2');
  await page.screenshot({path:'qa/detail-desktop.png'});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#product-dialog').evaluate(d=>d.open),false);
  assert.ok(!page.url().includes('design='));
  await page.locator('#gift-size').selectOption('L');
  const mail=decodeURIComponent(await page.locator('#email-shortlist').getAttribute('href'));
  assert.ok(mail.includes('Claus mode')&&mail.includes('Ship the gifts')&&mail.includes('Preferred size: L'));
  await page.locator('#show-saved').click();
  assert.equal(await page.locator('.product').count(),2);
  await page.locator('[data-filter="All"]').click();
  for(const image of await page.locator('.product-image img').all()){
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image=>image.decode());
  }
  await page.locator('.story-image img').scrollIntoViewIfNeeded();
  await page.locator('.story-image img').evaluate(image=>image.decode());
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'qa/desktop.png'});
  await page.screenshot({path:'qa/desktop-full.png',fullPage:true});
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(()=>window.scrollTo(0,0));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,`No overflow at ${width}px`);
    if(width===390){
      await page.screenshot({path:'qa/mobile.png'});
      await page.screenshot({path:'qa/mobile-full.png',fullPage:true});
      await page.locator('[data-open="claude-claus"]').first().click();
      assert.equal(await page.locator('#product-dialog').evaluate(d=>d.scrollWidth>d.clientWidth),false,'Mobile dialog fits');
      await page.screenshot({path:'qa/detail-mobile.png'});
      await page.locator('#close-dialog').click();
    }
  }
  await page.goto(new URL('?design=pair-programming',base).href,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#dialog-title').textContent(),'North Pole pair programming','Shared deep link opens exact design');
  await page.keyboard.press('Escape');
  const missingImages=await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));
  assert.deepEqual(missingImages,[],'All loaded images are valid');
  assert.deepEqual(errors,[],'No browser exceptions');
  assert.deepEqual(broken,[],'No failed resource responses');
  console.log('PASS: all ten designs, all filters, persisted favorites, dialog and Escape, exact share link, shortlist email and size, 320/390/768px layout, desktop/mobile screenshots, no broken resources or browser exceptions.');
}finally{await browser.close();}
