// End-to-end smoke test of the app in DEMO mode (config.js with an empty SUPABASE_URL).
// Usage: node scripts/smoke_test.cjs [screenshotDir]
// Serves web/ locally, drives a phone-sized browser through every flow, checks the desktop two-pane layout,
// runs an axe accessibility scan on each screen (fails on serious/critical issues) and fails on console errors.
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/`;
const webDir = path.join(__dirname, '..', 'web');
const AXE_PATH = require.resolve('axe-core/axe.min.js');
const screenshotDir = process.argv[2];

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const ok = await fetch(BASE).then((response) => response.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('static server did not start');
}

// Serious and critical axe findings fail the test; minor/moderate ones are reported only.
async function scanAccessibility(page, screen, findings) {
  // Let finite transitions settle first (e.g. a button fading from disabled), so colors are final.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
    .map((animation) => animation.finished)));
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  for (const violation of result.violations) {
    const nodes = violation.nodes.map((node) => `${node.target.join(" ")} ${node.any.map((check) => check.message).join("; ")}`).join(" | ");
    const line = `${screen}: [${violation.impact}] ${violation.id} (${violation.nodes.length}x) ${violation.help}: ${nodes}`;
    if (violation.impact === 'serious' || violation.impact === 'critical') findings.blocking.push(line);
    else findings.minor.push(line);
  }
}

// The real config.js points at the live Supabase project; tests always run against the in-memory demo.
const DEMO_CONFIG = `export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
export const GROUP_NAME = '7Tech';
export const LINKEDIN_COMPANIES_JOBS_URL = 'https://t.ly/us1NH';
`;

async function useDemoConfig(target) {
  await target.route('**/js/config.js', (route) => route.fulfill({ contentType: 'text/javascript', body: DEMO_CONFIG }));
}

function watchErrors(page, errors) {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
}

async function login(page, email, code = '123456') {
  await page.fill('input[type=email]', email);
  await page.click('form button[type=submit]');
  await page.locator('.otp__box').first().fill(code); // autofill-style: the whole code into the first box
}

async function phoneFlows(browser, findings, scheme) {
  const context = await browser.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
  await useDemoConfig(context);
  const page = await context.newPage();
  const errors = [];
  watchErrors(page, errors);
  const shot = async (name) => { if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, `${scheme}-${name}.png`) }); };
  const cards = () => page.locator('.results .person-card__main');
  const scan = (screen) => scanAccessibility(page, `${scheme}/${screen}`, findings);

  // Login (Hebrew, RTL by default); a wrong code shows a friendly error and clears the boxes.
  await page.goto(BASE);
  assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  await page.getByText('מצב דמו').waitFor();
  await scan('login');
  await shot('01-login');
  await login(page, 'demo@example.com', '000000');
  await page.getByText('הקוד שגוי או שפג תוקפו').waitFor();
  assert.equal(await page.locator('.otp__box').first().inputValue(), '', 'boxes cleared after a wrong code');
  assert.deepEqual(errors, ['pageerror: Token has expired or is invalid'], 'wrong code surfaces as a friendly toast');
  errors.length = 0;
  await page.locator('.otp__box').first().fill('123456');

  // People: search, highlight, chips
  await cards().first().waitFor();
  assert.equal(await cards().count(), 14, 'approved demo members');
  await scan('people');
  await shot('02-people');
  await page.fill('input.input--search', 'python');
  assert.equal(await cards().count(), 2, 'search "python" (Yossi + Maya)');
  await page.fill('input.input--search', 'פיתוח backend');
  assert.equal(await cards().count(), 1, 'Hebrew field label search finds Yossi');
  await page.fill('input.input--search', 'nimbus');
  assert.ok(await page.locator('.results mark').count() > 0, 'matches are highlighted');
  await page.fill('input.input--search', 'zzzz');
  await page.getByText('לא נמצאו אנשים').waitFor();
  await page.locator('.empty').getByRole('button', { name: 'נקה סינון' }).click();
  assert.equal(await cards().count(), 14, 'empty state clears everything in one tap');
  await page.getByRole('button', { name: 'מחפשים עבודה' }).click();
  assert.equal(await cards().count(), 3, 'looking-for-work filter');
  await page.locator('.chip--clear').click();
  await page.getByRole('button', { name: 'הפניות לחברה שלי' }).click();
  assert.equal(await cards().count(), 6, 'offers referrals filter');
  await page.locator('.chip--clear').click();
  await page.getByRole('button', { name: /המחזור שלי/ }).click();
  assert.equal(await cards().count(), 2, '"my course" chip (course 98)');
  await page.locator('.chip--clear').click();
  await page.fill('input.input--search', '115');
  assert.equal(await cards().count(), 3, 'search by course number');
  await page.fill('input.input--search', '');
  assert.equal(await page.locator('.results .person-card').last().getByText('מהרשימה הישנה').count(), 1, 'unconfirmed imports listed last');

  // Profile → connect sheet → preview → WhatsApp link
  await cards().filter({ hasText: 'יוסי כהן' }).click();
  await page.getByRole('heading', { name: 'יוסי כהן' }).waitFor();
  await scan('member');
  await shot('03-member');
  await page.getByRole('button', { name: /הודעה ל.*יוסי/ }).click();
  const sheet = page.locator('dialog.sheet');
  await sheet.waitFor();
  assert.equal(await sheet.locator('.btn--list').count(), 3, 'hello + question + referral (Yossi offers referrals, questions)');
  assert.equal(await sheet.locator('.btn--send').getAttribute('aria-disabled'), 'true', 'send is disabled until a message is chosen');
  await sheet.getByRole('button', { name: /לבקש הפניה/ }).click();
  await sheet.locator('.preview-bubble', { hasText: 'Nimbus Labs' }).waitFor();
  assert.match(await sheet.locator('.btn--send').getAttribute('href'), /^https:\/\/wa\.me\/972500000002\?text=/);
  await scan('connect-sheet');
  await shot('04-sheet');
  await page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'detached' });
  await page.getByRole('link', { name: /כל החברים ב-.*Nimbus Labs/ }).click();
  await cards().first().waitFor();
  assert.equal(await cards().count(), 3, 'company filter from the profile');
  await page.locator('.chip--brass', { hasText: 'Nimbus Labs' }).click();

  // Companies, jobs (LinkedIn filter, post, delete)
  await page.click('a.tabbar__tab[href="#/companies"]');
  await page.locator('.list-card').first().waitFor();
  assert.match(await page.locator('.list-card').first().innerText(), /Nimbus Labs/);
  await scan('companies');
  await page.click('a.tabbar__tab[href="#/jobs"]');
  const jobs = page.locator('.results > article');
  await jobs.first().waitFor();
  assert.equal(await jobs.count(), 3);
  assert.equal(await page.getByRole('link', { name: /משרות בלינקדאין/ }).getAttribute('href'), 'https://t.ly/us1NH', 'LinkedIn jobs filter button');
  await page.getByRole('button', { name: /פרסום משרה שאני/ }).click();
  await page.getByRole('button', { name: 'פרסום', exact: true }).click();
  await page.locator('.field[data-field="title"][data-invalid="true"]').waitFor(); // inline error on empty role
  await page.fill('input[name=title]', 'Staff Engineer');
  await page.getByRole('button', { name: 'פרסום', exact: true }).click();
  await jobs.filter({ hasText: 'Staff Engineer' }).waitFor();
  assert.equal(await jobs.count(), 4, 'posted job appears');
  await scan('jobs');
  await shot('05-jobs');
  page.once('dialog', (dialog) => dialog.accept());
  await jobs.filter({ hasText: 'Staff Engineer' }).getByRole('button', { name: 'מחיקה' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.results > article').length === 3);

  // Me: save bar appears on change, inline error, save, unsaved-changes guard
  await page.click('a.tabbar__tab[href="#/me"]');
  const saveBar = page.locator('.save-bar');
  assert.equal(await saveBar.isHidden(), true, 'no save bar until something changes');
  await page.fill('input[name=phone]', '12');
  await saveBar.waitFor();
  await saveBar.getByRole('button').click();
  await page.locator('.field[data-field="phone"][data-invalid="true"]').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.name), 'phone', 'focus moves to the invalid field');
  await page.fill('input[name=phone]', '052-555-1234');
  await page.fill('input[name=company]', 'Nimbus Labs Global');
  await page.fill('input[name=course]', 'צ"ט');
  await page.fill('textarea[name=seeking]', 'Board advisor roles');
  await page.getByLabel('לינקדאין', { exact: true }).check();
  await saveBar.getByRole('button').click();
  await page.getByText('הפרופיל נשמר').waitFor();
  assert.equal(await page.inputValue('input[name=phone]'), '052-555-1234', 'form keeps what was typed after saving');
  await saveBar.waitFor({ state: 'hidden' });
  await scan('me');
  await shot('06-me');
  await page.fill('input[name=location]', 'חיפה');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.click('a.tabbar__tab[href="#/"]');
  // Staying put when the user cancels leaving unsaved changes (the guard runs on hashchange, so wait for it).
  await page.waitForFunction(() => location.hash === '#/me' && document.querySelector('input[name=location]').value === 'חיפה');
  page.once('dialog', (dialog) => dialog.accept());
  await page.click('a.tabbar__tab[href="#/"]');
  await cards().first().waitFor();
  await cards().filter({ hasText: 'דנה לוי' }).click();
  await page.getByRole('heading', { name: 'דנה לוי' }).waitFor();
  assert.match(await page.locator('.profile-hero').innerText(), /Nimbus Labs Global/);
  assert.match(await page.locator('.profile-hero .tag--course').innerText(), /99/, 'צ"ט saved as course 99');

  // Admin (inside Me): approve a request
  await page.click('a.tabbar__tab[href="#/me"]');
  await page.getByRole('link', { name: 'כלי ניהול' }).click();
  await page.getByRole('heading', { name: 'בקשות הצטרפות' }).waitFor();
  assert.equal(await page.locator('.stat__value').nth(1).innerText(), '2', 'two pending');
  assert.equal(await page.locator('.stat__value').nth(3).innerText(), '2', 'two unconfirmed imports');
  await scan('admin');
  await shot('07-admin');
  await page.getByRole('button', { name: 'אישור' }).first().click();
  await page.waitForFunction(() => document.querySelectorAll('.stat__value')[1].textContent === '1');
  await page.click('a.tabbar__tab[href="#/"]');
  await cards().first().waitFor();
  assert.equal(await cards().count(), 15, 'approved member appears in the directory');

  // Theme and language
  await page.click('a.tabbar__tab[href="#/me"]');
  await page.getByRole('button', { name: 'כהה' }).click();
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark', 'manual dark theme');
  await page.getByRole('button', { name: 'אוטומטי' }).click();
  assert.equal(await page.getAttribute('html', 'data-theme'), null, 'back to following the device');
  await page.getByRole('button', { name: 'English' }).click();
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  await page.click('a.tabbar__tab[href="#/"]');
  await page.getByPlaceholder(/Search: name/).waitFor();
  await scan('people-en');
  await shot('08-people-en');

  // "Is this you?" for an imported, unconfirmed member
  await page.click('a.tabbar__tab[href="#/me"]');
  await page.getByRole('button', { name: 'Log out' }).click();
  await login(page, 'ron@example.com');
  await page.getByRole('heading', { name: 'Is this you?' }).waitFor();
  await scan('confirm');
  await shot('09-confirm');
  await page.getByRole('button', { name: /Looks right/ }).click();
  await cards().first().waitFor();

  // Joining as a new person
  await page.click('a.tabbar__tab[href="#/me"]');
  await page.getByRole('button', { name: 'Log out' }).click();
  await login(page, 'newbie@example.com');
  await page.getByRole('heading', { name: 'Join the directory' }).waitFor();
  await page.fill('input[name=full_name]', 'New Person');
  await page.fill('input[name=linkedin_url]', 'linkedin.com/in/new-person');
  await page.getByRole('button', { name: 'Send join request' }).click();
  await page.getByRole('heading', { name: 'Waiting for approval' }).waitFor();
  assert.equal(await page.locator('nav.app-tabbar').isHidden(), true, 'pending users get no tabs');

  assert.deepEqual(errors, [], `browser console errors (${scheme})`);
  await context.close();
}

async function desktopFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await useDemoConfig(page);
  const errors = [];
  watchErrors(page, errors);
  await page.goto(BASE);
  await login(page, 'demo@example.com');
  await page.locator('.split__list .person-card__main').first().waitFor();
  await page.getByText('בחרו מישהו מהרשימה').waitFor();
  await page.fill('.split__list input.input--search', 'python');
  await page.locator('.split__list .person-card__main', { hasText: 'יוסי' }).click();
  await page.locator('.split__detail').getByRole('heading', { name: 'יוסי כהן' }).waitFor();
  assert.equal(await page.inputValue('.split__list input.input--search'), 'python', 'list keeps its search while a profile opens beside it');
  assert.equal(await page.locator('.split__list .person-card[aria-current="true"]').count(), 1, 'open profile is marked in the list');
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'desktop.png') });
  assert.deepEqual(errors, [], 'browser console errors (desktop)');
  await page.close();
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', webDir], { stdio: 'ignore' });
  const browser = await chromium.launch();
  const findings = { blocking: [], minor: [] };
  try {
    await waitForServer();
    await phoneFlows(browser, findings, 'light');
    await phoneFlows(browser, findings, 'dark');
    await desktopFlow(browser);
    if (findings.minor.length > 0) console.log(`Minor accessibility notes:\n  ${[...new Set(findings.minor)].join('\n  ')}`);
    assert.deepEqual(findings.blocking, [], 'serious/critical accessibility issues');
    console.log('SMOKE TEST PASSED (flows, desktop split, accessibility scan in light + dark)');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().then(null, (error) => {
  console.error(error);
  process.exit(1);
});
