// Two steps: email → 6-digit code from the email. The email also has a magic link that works
// in a normal browser tab; the code is what works inside an installed iPhone app.
import { api, isDemo } from '../api.js';
import { GROUP_NAME } from '../config.js';
import { DEMO_ADMIN_EMAIL, DEMO_LOGIN_CODE } from '../demo-backend.js';
import { getLang, LANGUAGES, setLang, t } from '../i18n.js';
import { h, mount, toast, withBusy } from '../ui.js';

export function renderLogin(ctx) {
  const container = h('div', { class: 'login-step' });
  showEmailStep(ctx, container);
  return h('section', { class: 'page login' },
    h('div', { class: 'login-hero' },
      h('img', { src: 'icons/icon.svg', alt: '', width: 72, height: 72 }),
      h('h1', {}, t('login.title', { group: GROUP_NAME })),
      h('p', { class: 'muted' }, t('login.tagline'))),
    h('ul', { class: 'login-benefits' },
      h('li', {}, t('login.benefit_find')),
      h('li', {}, t('login.benefit_connect')),
      h('li', {}, t('login.benefit_update'))),
    container,
    isDemo && h('p', { class: 'card card-info small' }, t('login.demo_hint', { email: DEMO_ADMIN_EMAIL, code: DEMO_LOGIN_CODE })),
    h('div', { class: 'button-row center' },
      LANGUAGES.filter((lang) => lang !== getLang()).map((lang) => h('button', {
        class: 'button button-ghost',
        onclick: () => { setLang(lang); ctx.render(); },
      }, t(`settings.switch_to_${lang}`)))));
}

function showEmailStep(ctx, container) {
  const input = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', inputmode: 'email', placeholder: 'name@example.com' });
  const submit = h('button', { class: 'button full', type: 'submit' }, t('login.send_code'));
  mount(container, h('form', {
    onsubmit: (event) => {
      event.preventDefault();
      const email = input.value.trim().toLowerCase();
      withBusy(submit, async () => {
        await api.sendLoginCode(email);
        showCodeStep(ctx, container, email);
      });
    },
  },
  h('label', { class: 'field' }, h('span', {}, t('login.email')), input),
  submit));
  input.focus();
}

function showCodeStep(ctx, container, email) {
  const input = h('input', {
    name: 'code', required: true, inputmode: 'numeric', autocomplete: 'one-time-code',
    pattern: '[0-9]{6,10}', maxlength: 10, class: 'code-input',
  });
  const submit = h('button', { class: 'button full', type: 'submit' }, t('login.verify'));
  mount(container, h('form', {
    onsubmit: (event) => {
      event.preventDefault();
      withBusy(submit, async () => {
        await api.verifyLoginCode(email, input.value.trim());
        await ctx.onSignedIn();
      });
    },
  },
  h('p', {}, t('login.code_sent', { email })),
  h('label', { class: 'field' }, h('span', {}, t('login.code')), input),
  submit,
  h('div', { class: 'button-row center' },
    h('button', { type: 'button', class: 'button button-ghost', onclick: () => showEmailStep(ctx, container) }, t('login.change_email')),
    h('button', {
      type: 'button',
      class: 'button button-ghost',
      onclick: async () => { await api.sendLoginCode(email); toast(t('login.code_resent')); },
    }, t('login.resend')))));
  input.focus();
}
