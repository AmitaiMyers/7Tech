// Theme: follows the device ("system") unless the member picks light or dark in settings.
// tokens.css switches every color via color-scheme; index.html applies the saved choice before first paint.
export const THEMES = ['system', 'light', 'dark'];
const STORAGE_KEY = 'theme';
const STATUS_BAR = { light: '#f5f6fa', dark: '#05070d' };

export function getTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(stored) ? stored : 'system';
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) throw new Error(`Unknown theme: ${theme}`);
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme();
}

export function applyTheme() {
  const theme = getTheme();
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme; else root.dataset.theme = theme;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const schemeOfMeta = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = STATUS_BAR[theme === 'system' ? schemeOfMeta : theme];
  }
}
