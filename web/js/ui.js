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

export function toast(message) {
  for (const previous of document.querySelectorAll('.toast')) previous.remove();
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 4000);
}

// Disables the button while an async action runs, so double taps don't submit twice.
export async function withBusy(button, action) {
  button.disabled = true;
  try {
    await action();
  } finally {
    button.disabled = false;
  }
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
  return h('div', { class: `avatar avatar-${size}`, style: `--hue:${hash}`, 'aria-hidden': 'true' }, initials(fullName));
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
