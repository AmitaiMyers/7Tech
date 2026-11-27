// Verifies Hebrew and English have the same keys, and every key the code uses exists.
// Usage: node scripts/check_i18n.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { STRINGS_FOR_TESTS: strings, LANGUAGES } = await import('../web/js/i18n.js');
const { CONTACT_METHODS, FIELDS, OFFERS, SENIORITIES } = await import('../web/js/constants.js');
const { THEMES } = await import('../web/js/theme.js');

const problems = [];
const [first, ...others] = LANGUAGES;
for (const lang of others) {
  for (const key of Object.keys(strings[first])) if (!(key in strings[lang])) problems.push(`"${key}" missing in ${lang}`);
  for (const key of Object.keys(strings[lang])) if (!(key in strings[first])) problems.push(`"${key}" missing in ${first}`);
}

// Keys built at runtime from fixed lists.
const MESSAGE_KINDS = ['hello', 'questions', 'referrals', 'cv_review', 'mock_interview', 'mentoring'];
const dynamicKeys = [
  ...FIELDS.map((value) => `field.${value}`),
  ...SENIORITIES.map((value) => `seniority.${value}`),
  ...OFFERS.map((value) => `offer.${value}`),
  ...CONTACT_METHODS.map((value) => `contact_method.${value}`),
  ...MESSAGE_KINDS.map((kind) => `contact.ask.${kind}`),
  ...MESSAGE_KINDS.map((kind) => `wa.${kind}`),
  ...['approved', 'pending', 'removed'].map((status) => `admin.status_${status}`),
  ...LANGUAGES.map((lang) => `settings.switch_to_${lang}`),
  ...THEMES.map((theme) => `settings.theme_${theme}`),
];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : entry.name.endsWith('.js') ? [join(dir, entry.name)] : []);
}

const jsDir = new URL('../web/js/', import.meta.url).pathname;
const staticKeys = sourceFiles(jsDir).flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/\bt(?:Plain)?\('([a-z_]+\.[a-z_.]+)'/g)].map((match) => match[1]));

for (const key of new Set([...staticKeys, ...dynamicKeys])) {
  for (const lang of LANGUAGES) if (!(key in strings[lang])) problems.push(`"${key}" used in code but missing in ${lang}`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`i18n OK: ${Object.keys(strings[first]).length} keys, ${new Set(staticKeys).size} used statically`);
