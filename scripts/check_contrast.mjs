// Fails if any foreground/background pair in web/css/tokens.css drops below WCAG AA, in either theme.
// Usage: node scripts/check_contrast.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../web/css/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)]
  .map(([, name, light, dark]) => [name, { light, dark }]));

const TEXT = 4.5;     // body text
const GRAPHIC = 3.0;  // icons, borders of controls, large text
const PAIRS = [
  ['text', 'bg', TEXT], ['text', 'surface', TEXT], ['text', 'surface-2', TEXT],
  ['text-muted', 'bg', TEXT], ['text-muted', 'surface', TEXT], ['text-muted', 'surface-2', TEXT],
  ['sail', 'bg', TEXT], ['sail', 'surface', TEXT], ['sail', 'sail-soft', TEXT], ['on-sail', 'sail', TEXT],
  ['sail-strong', 'sail-soft', TEXT],
  ['brass-text', 'surface', TEXT], ['brass-text', 'brass-soft', TEXT], ['brass', 'surface', GRAPHIC],
  ['success', 'surface', TEXT], ['success', 'success-soft', TEXT],
  ['warning', 'warning-soft', TEXT], ['danger', 'surface', TEXT], ['danger', 'danger-soft', TEXT],
];

function luminance(hex) {
  const channel = (i) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Fixed brand surfaces that are dark in both themes.
const fixed = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, value]) => [name, value]));
const FIXED_PAIRS = [['on-abyss', 'abyss', TEXT], ['on-abyss-muted', 'abyss', TEXT], ['on-abyss-muted', 'abyss-glow', TEXT], ['sail-on-abyss', 'abyss', GRAPHIC]];

const failures = [];
for (const [fg, bg, required] of FIXED_PAIRS) {
  const ratio = contrast(fixed[fg], fixed[bg]);
  if (ratio < required) failures.push(`fixed: --color-${fg} on --color-${bg} = ${ratio.toFixed(2)} (needs ${required})`);
}
for (const [fg, bg, required] of PAIRS) {
  if (!(fg in tokens) || !(bg in tokens)) throw new Error(`Unknown token in PAIRS: ${fg} / ${bg}`);
  for (const theme of ['light', 'dark']) {
    const ratio = contrast(tokens[fg][theme], tokens[bg][theme]);
    if (ratio < required) failures.push(`${theme}: --color-${fg} on --color-${bg} = ${ratio.toFixed(2)} (needs ${required})`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`contrast OK: ${PAIRS.length} pairs × 2 themes + ${FIXED_PAIRS.length} brand pairs meet WCAG AA`);
