// End-to-end smoke test of the app in DEMO mode (config.js with an empty SUPABASE_URL).
// Usage: node scripts/smoke_test.cjs [screenshotDir]
// Serves web/ on a local port, drives a phone-sized browser through every screen,
// and fails on any assertion or on any browser console error.
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/`;
const webDir = path.join(__dirname, '..', 'web');
const screenshotDir = process.argv[2];

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const ok = await fetch(BASE).then((response) => response.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('static server did not start');
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', webDir], { stdio: 'ignore' });
  const browser = await chromium.launch();
  const errors = [];
  try {
    await waitForServer();
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    const shot = async (name) => { if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, `${name}.png`) }); };
    const count = async () => page.locator('.member-card').count();

    // Login (Hebrew, RTL by default)
    await page.goto(BASE);
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    await page.getByText('מצב דמו').waitFor();
    await shot('01-login');
    await page.fill('input[type=email]', 'demo@example.com');
    await page.click('button[type=submit]');
    await page.fill('input[name=code]', '000000');
    await page.click('button[type=submit]');
    await page.getByText('הקוד שגוי או שפג תוקפו').waitFor();
    assert.deepEqual(errors, ['pageerror: Token has expired or is invalid'], 'wrong code surfaces as a friendly error toast');
    errors.length = 0;
    await page.fill('input[name=code]', '123456');
    await page.click('button[type=submit]');

    // Directory
    await page.locator('.member-card').first().waitFor();
    assert.equal(await count(), 14, 'approved demo members');
    await shot('02-directory');
    await page.fill('input.search', 'python');
    assert.equal(await count(), 2, 'search "python" (Yossi + Maya)');
    await page.fill('input.search', 'פיתוח backend');
    assert.equal(await count(), 1, 'Hebrew field label search finds Yossi');
    await page.fill('input.search', '');
    await page.getByRole('button', { name: '🔍 מחפשים עבודה' }).click();
    assert.equal(await count(), 3, 'looking-for-work filter');
    await shot('03-looking-filter');
    await page.getByRole('button', { name: 'נקה סינון' }).click();
    assert.equal(await count(), 14, 'clear filters');
    await page.getByRole('button', { name: 'הפניות לחברה שלי' }).click();
    assert.equal(await count(), 6, 'offers referrals filter');
    await page.getByRole('button', { name: 'נקה סינון' }).click();
    await page.getByRole('button', { name: /המחזור שלי/ }).click();
    assert.equal(await count(), 2, '"my course" chip (course 98)');
    await page.getByRole('button', { name: 'נקה סינון' }).click();
    await page.fill('input.search', '115');
    assert.equal(await count(), 3, 'search by course number');
    await page.fill('input.search', '');
    assert.equal(await page.locator('.member-card').last().getByText('מהרשימה הישנה').count(), 1, 'unconfirmed imports listed last');

    // Member page + WhatsApp templates
    await page.locator('.member-card-link', { hasText: 'יוסי כהן' }).click();
    await page.getByRole('heading', { name: 'יוסי כהן' }).waitFor();
    const referralHref = await page.locator('.message-button', { hasText: 'הפניה' }).getAttribute('href');
    assert.match(referralHref, /^https:\/\/wa\.me\/972500000002\?text=/);
    assert.match(decodeURIComponent(referralHref), /Nimbus Labs/);
    assert.equal(await page.locator('.message-button').count(), 3, 'hello + question + referral (Yossi offers referrals, questions)');
    await shot('04-member');
    await page.click('a.back-link');
    await page.locator('.member-card-link', { hasText: 'Daniel Mizrahi' }).click();
    await page.getByRole('heading', { name: 'מה אני מחפש/ת' }).waitFor();
    await page.getByText(/מעדיף\/ה ליצור קשר ב:.*וואטסאפ/).waitFor();
    await page.click('a.back-link');
    await page.locator('.member-card-link', { hasText: 'יוסי כהן' }).click();
    await page.getByText(/כל החברים ב-.*Nimbus Labs/).click();
    await page.locator('.member-card').first().waitFor();
    assert.equal(await count(), 3, 'company filter from member page');
    await page.getByRole('button', { name: /Nimbus Labs.*✕/ }).click();

    // Companies
    await page.click('a.tab[href="#/companies"]');
    await page.locator('.company-row').first().waitFor();
    assert.match(await page.locator('.company-row').first().innerText(), /Nimbus Labs/);
    await shot('05-companies');

    // Jobs: list, post, delete
    await page.click('a.tab[href="#/jobs"]');
    await page.locator('.job-card').first().waitFor();
    assert.equal(await page.locator('.job-card').count(), 3);
    assert.equal(await page.getByRole('link', { name: /משרות בלינקדאין/ }).getAttribute('href'), 'https://t.ly/us1NH', 'LinkedIn jobs filter button');
    await page.getByRole('button', { name: /פרסום משרה/ }).click();
    await page.fill('input[name=title]', 'Staff Engineer');
    await page.getByRole('button', { name: 'פרסום', exact: true }).click();
    await page.locator('.job-card', { hasText: 'Staff Engineer' }).waitFor();
    assert.equal(await page.locator('.job-card').count(), 4, 'posted job appears');
    await shot('06-jobs');
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.job-card', { hasText: 'Staff Engineer' }).getByRole('button', { name: 'מחיקה' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.job-card').length === 3);

    // Me: validation, save, confirm freshness
    await page.click('a.tab[href="#/me"]');
    await page.fill('input[name=phone]', '12');
    await page.click('form.profile-form button[type=submit]');
    await page.locator('.form-errors li').first().waitFor();
    await page.fill('input[name=phone]', '052-555-1234');
    await page.fill('input[name=company]', 'Nimbus Labs Global');
    await page.fill('input[name=course]', 'צ"ט');
    await page.fill('textarea[name=seeking]', 'Board advisor roles');
    await page.getByLabel('לינקדאין', { exact: true }).check();
    await page.click('form.profile-form button[type=submit]');
    await page.getByText('הפרופיל נשמר').waitFor();
    assert.equal(await page.inputValue('input[name=phone]'), '+972525551234', 'phone normalized');
    assert.equal(await page.inputValue('input[name=course]'), '99', 'Hebrew-numeral course saved as a number');
    assert.ok(await page.getByLabel('לינקדאין', { exact: true }).isChecked(), 'contact preference saved');
    await shot('07-me');

    // Admin: approve a pending request
    await page.click('a.tab[href="#/admin"]');
    await page.getByRole('heading', { name: 'בקשות הצטרפות' }).waitFor();
    assert.equal(await page.locator('.stat strong').nth(1).innerText(), '2', 'two pending');
    assert.equal(await page.locator('.stat strong').nth(3).innerText(), '2', 'two unconfirmed imports');
    await shot('08-admin');
    await page.getByRole('button', { name: 'אישור' }).first().click();
    await page.waitForFunction(() => document.querySelectorAll('.stat strong')[1].textContent === '1');
    await page.click('a.tab[href="#/"]');
    await page.locator('.member-card').first().waitFor();
    assert.equal(await count(), 15, 'approved member appears in directory');

    // English / LTR
    await page.click('a.tab[href="#/me"]');
    await page.getByRole('button', { name: 'English' }).click();
    assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
    await page.click('a.tab[href="#/"]');
    await page.getByPlaceholder(/Search: name/).waitFor();
    await shot('09-directory-en');

    // Sign out, then join as a new person
    await page.click('a.tab[href="#/me"]');
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.fill('input[type=email]', 'newbie@example.com');
    await page.click('button[type=submit]');
    await page.fill('input[name=code]', '123456');
    await page.click('button[type=submit]');
    await page.getByRole('heading', { name: 'Join the directory' }).waitFor();
    await page.fill('input[name=full_name]', 'New Person');
    await page.fill('input[name=linkedin_url]', 'linkedin.com/in/new-person');
    await page.click('form.profile-form button[type=submit]');
    await page.getByRole('heading', { name: 'Waiting for approval' }).waitFor();
    assert.equal(await page.locator('.tab-bar').count(), 0, 'pending users get no tabs');
    await shot('10-pending');

    assert.deepEqual(errors, [], 'browser console errors');
    console.log('SMOKE TEST PASSED');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().then(null, (error) => {
  console.error(error);
  process.exit(1);
});
