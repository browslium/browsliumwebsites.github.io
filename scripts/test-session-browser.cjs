#!/usr/bin/env node
// Exercise the generated site in Chrome. Session attributes exist only in the
// local HTTP response; the publishable HTML stays unconfigured.
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', 'dist');
const statusUrl = 'https://app.browslium.com/api/v1/client/v1/auth/session-status';
const dashboardUrl = 'https://app.browslium.com/dashboard';
const loginUrl = 'https://app.browslium.com/login';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp',
  '.png':'image/png', '.ico':'image/x-icon', '.mp4':'video/mp4' };

function serverForBuild() {
  return createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
    const filename = path.resolve(root, relative, url.pathname.endsWith('/') ? 'index.html' : '');
    if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    try {
      let body = readFileSync(filename);
      if (url.searchParams.has('qa-wired') && filename.endsWith('index.html')) {
        const html = body.toString().replace('<body ',
          `<body data-session-endpoint="${statusUrl}" data-dashboard-url="${dashboardUrl}" `);
        assert.notEqual(html, body.toString(), 'HTML response contains a body to wire');
        body = Buffer.from(html);
      }
      response.writeHead(200, { 'Content-Type':mime[path.extname(filename)] || 'application/octet-stream',
        'Cache-Control':'no-store' }).end(body);
    } catch { response.writeHead(404).end(); }
  });
}

async function waitUntil(predicate, message) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(message);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function checkLinks(page, label, href) {
  assert.deepEqual(await page.locator('[data-session-link]').allTextContents(), [label, label]);
  assert.deepEqual(await page.locator('[data-session-link]').evaluateAll(links => links.map(link => link.href)), [href, href]);
}

async function runViewport(browser, site, viewport, name) {
  const context = await browser.newContext({ viewport });
  let requests = 0;
  let behavior = { kind:'hold' };
  const pending = [];
  const responseFor = (route, reply) => route.fulfill({ status:reply.status || 200,
    contentType:'application/json', headers:{
      'Access-Control-Allow-Origin':site.origin,
      'Access-Control-Allow-Credentials':'true',
      'Cache-Control':'no-store',
      'Vary':'Origin',
    }, body:reply.body });
  await context.route('**/*', route => {
    const target = new URL(route.request().url());
    if (target.origin === site.origin) {
      if (/\.(webp|mp4)$/.test(target.pathname)) route.abort();
      else route.continue();
      return;
    }
    if (target.href !== statusUrl) { route.abort(); return; }
    requests++;
    if (behavior.kind === 'hold') pending.push(route);
    else if (behavior.kind === 'abort') route.abort();
    else responseFor(route, behavior);
  });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/en/?qa-wired=1', site).href, { waitUntil:'domcontentloaded' });
    await waitUntil(() => pending.length > 0, `${name}: initial request missing`);
    await checkLinks(page, 'Sign In', loginUrl);
    if (name === 'mobile') {
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('.mobile-sign-in').isVisible(), true);
    }

    behavior = { kind:'reply', body:'{"authenticated":true}' };
    for (const route of pending.splice(0)) await responseFor(route, behavior);
    await page.waitForFunction(() => [...document.querySelectorAll('[data-session-link]')]
      .every(link => link.textContent === link.dataset.dashboardLabel));
    await checkLinks(page, 'Dashboard', dashboardUrl);

    behavior = { kind:'reply', body:'{"authenticated":false}' };
    let before = requests;
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await waitUntil(() => requests > before, `${name}: focus did not recheck`);
    await settle(page);
    await checkLinks(page, 'Sign In', loginUrl);

    behavior = { kind:'hold' };
    before = pending.length;
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await waitUntil(() => pending.length > before, `${name}: visibility return did not recheck`);
    await checkLinks(page, 'Sign In', loginUrl);
    behavior = { kind:'reply', body:'{"authenticated":true}' };
    for (const route of pending.splice(0)) await responseFor(route, behavior);
    await page.waitForFunction(() => document.querySelector('.header-sign-in')?.textContent === 'Dashboard');
    await checkLinks(page, 'Dashboard', dashboardUrl);

    behavior = { kind:'hold' };
    before = pending.length;
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted:true })));
    await waitUntil(() => pending.length > before, `${name}: pageshow did not recheck`);
    await checkLinks(page, 'Sign In', loginUrl);
    behavior = { kind:'reply', body:'{"authenticated":true}' };
    for (const route of pending.splice(0)) await responseFor(route, behavior);
    await page.waitForFunction(() => document.querySelector('.header-sign-in')?.textContent === 'Dashboard');

    before = requests;
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable:true, value:'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await checkLinks(page, 'Sign In', loginUrl);
    assert.equal(requests, before, `${name}: hidden page must not request session status`);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable:true, value:'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitUntil(() => requests > before, `${name}: visible page did not recheck`);
    await page.waitForFunction(() => document.querySelector('.header-sign-in')?.textContent === 'Dashboard');

    behavior = { kind:'hold' };
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await waitUntil(() => pending.length === 1, `${name}: first overlapping request missing`);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await waitUntil(() => pending.length === 2, `${name}: second overlapping request missing`);
    await checkLinks(page, 'Sign In', loginUrl);
    const [oldRoute, latestRoute] = pending.splice(0);
    await responseFor(latestRoute, { body:'{"authenticated":false}' });
    await settle(page);
    await responseFor(oldRoute, { body:'{"authenticated":true}' });
    await settle(page);
    await checkLinks(page, 'Sign In', loginUrl);

    for (const reply of [
      { status:201, body:'{"authenticated":true}' },
      { body:'{"authenticated":"true"}' },
      { body:'{"authenticated":true,"role":"client"}' },
      { body:'not-json' },
    ]) {
      behavior = { kind:'reply', ...reply };
      before = requests;
      await page.evaluate(() => dispatchEvent(new Event('focus')));
      await waitUntil(() => requests > before, `${name}: invalid response check missing`);
      await settle(page);
      await checkLinks(page, 'Sign In', loginUrl);
    }

    behavior = { kind:'reply', body:'{"authenticated":true}' };
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('.header-sign-in')?.textContent === 'Dashboard');
    behavior = { kind:'abort' };
    before = requests;
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await waitUntil(() => requests > before, `${name}: network failure check missing`);
    await settle(page);
    await checkLinks(page, 'Sign In', loginUrl);

    const raw = await context.newPage();
    behavior = { kind:'reply', body:'{"authenticated":true}' };
    before = requests;
    await raw.goto(new URL('/en/', site).href, { waitUntil:'domcontentloaded' });
    await settle(raw);
    await checkLinks(raw, 'Sign In', loginUrl);
    assert.equal(requests, before, `${name}: unconfigured HTML must not request session status`);
    assert.deepEqual(await raw.evaluate(() => [document.body.dataset.sessionEndpoint || '',
      document.body.dataset.dashboardUrl || '']), ['', '']);
  } finally {
    await context.close();
  }
}

async function main() {
  const server = serverForBuild();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const site = new URL(`http://127.0.0.1:${server.address().port}`);
  let browser;
  try {
    browser = await chromium.launch({
      executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless:true, args:['--no-first-run','--disable-background-networking','--disable-default-apps'],
    });
    await runViewport(browser, site, { width:1440, height:900 }, 'desktop');
    await runViewport(browser, site, { width:390, height:844 }, 'mobile');
    console.log('PASS: generated site session links revalidate and fail closed in desktop/mobile Chrome');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
