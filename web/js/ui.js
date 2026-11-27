// Tiny DOM helpers. All user content goes through textContent / setAttribute, never innerHTML.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      el.className = value;
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
}

export function mount(container, ...children) {
  container.replaceChildren();
  appendChildren(container, children);
}

const TOAST_MS = 3500;
const SUCCESS_MS = 1200;

// One toast at a time; slides up, leaves after 3.5 s or when tapped. `action` = { label, run }.
export function toast(message, action = null) {
  for (const previous of document.querySelectorAll('.toast')) previous.remove();
  const el = h('div', { class: 'toast', role: 'status' },
    h('span', {}, message),
    action && h('button', { class: 'toast__action', onclick: () => { dismiss(); action.run(); } }, action.label));
  function dismiss() {
    if (!el.isConnected || el.dataset.leaving === 'true') return;
    el.dataset.leaving = 'true';
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400); // reduced motion: no animationend
  }
  el.addEventListener('click', (event) => { if (event.target === el) dismiss(); });
  document.body.append(el);
  setTimeout(dismiss, TOAST_MS);
}

// A short tick on phones that support it (Android); silently nothing elsewhere.
export function haptic() {
  if ('vibrate' in navigator) navigator.vibrate(10);
}

// Runs an async action on a button: loading state (width locked, spinner), then a brief ✓.
// Double taps are ignored while busy. Errors propagate after the button is restored.
export async function withBusy(button, action) {
  if (button.getAttribute('aria-busy') === 'true') return;
  button.style.width = `${button.offsetWidth}px`;
  button.setAttribute('aria-busy', 'true');
  button.disabled = true;
  let succeeded = false;
  try {
    await action();
    succeeded = true;
  } finally {
    button.removeAttribute('aria-busy');
    button.disabled = false;
    if (succeeded && button.isConnected) {
      button.dataset.state = 'success';
      haptic();
      setTimeout(() => { delete button.dataset.state; button.style.width = ''; }, SUCCESS_MS);
    } else {
      button.style.width = '';
    }
  }
}

// Wraps occurrences of the search tokens in <mark> (case-insensitive). Returns nodes for h().
export function highlight(text, tokens) {
  if (tokens.length === 0) return [text];
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.split(pattern).map((part, index) => (index % 2 === 1 ? h('mark', {}, part) : part));
}

export function initials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function avatar(fullName, size = 'md') {
  let hash = 0;
  for (const char of fullName) hash = (hash * 31 + char.codePointAt(0)) % 360;
  return h('div', { class: size === 'lg' ? 'avatar avatar--lg' : 'avatar', style: `--hue:${hash}`, 'aria-hidden': 'true' }, initials(fullName));
}

export function downloadFile(filename, mimeType, content) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Reads named form fields into a plain object; checkboxes sharing a name become arrays.
export function readForm(form) {
  const values = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox' && el.dataset.group === 'true') {
      values[el.name] = values[el.name] ?? [];
      if (el.checked) values[el.name].push(el.value);
    } else if (el.type === 'checkbox') {
      values[el.name] = el.checked;
    } else {
      values[el.name] = el.value.trim();
    }
  }
  return values;
}
