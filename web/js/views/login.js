// Login: email → 6-digit code. The email also has a magic link that works in a normal browser tab;
// the code is what works inside an installed iPhone app.
import { api, isDemo } from '../api.js';
import { button, textField } from '../components.js';
import { GROUP_NAME } from '../config.js';
import { OTP_LENGTH } from '../constants.js';
import { DEMO_ADMIN_EMAIL, DEMO_LOGIN_CODE } from '../demo-backend.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { h, mount, toast, withBusy } from '../ui.js';
import { languageSwitch } from './me.js';

const RESEND_AFTER_SECONDS = 30;

export function renderLogin(ctx) {
  const step = h('div', { class: 'stack' });
  showEmailStep(ctx, step);
  return h('section', { class: 'page' },
    h('div', { class: 'login-hero' },
      h('div', { class: 'sonar', 'aria-hidden': 'true' }, h('img', { src: 'icons/logo-mark.svg', alt: '' })),
      h('h1', { class: 'wordmark' }, GROUP_NAME),
      h('p', {}, t('login.tagline'))),
    h('ul', { class: 'benefits' },
      h('li', {}, icon('search'), t('login.benefit_find')),
      h('li', {}, icon('whatsapp'), t('login.benefit_connect')),
      h('li', {}, icon('user'), t('login.benefit_update'))),
    h('div', { class: 'card stack' }, step),
    isDemo && h('p', { class: 'card small' }, t('login.demo_hint', { email: DEMO_ADMIN_EMAIL, code: DEMO_LOGIN_CODE })),
    h('div', { class: 'row', style: 'justify-content:center' }, languageSwitch(ctx)));
}

function showEmailStep(ctx, step) {
  const emailField = textField('email', t('login.email'), '', {
    type: 'email', required: true, autocomplete: 'email', inputmode: 'email', placeholder: 'name@example.com', enterkeyhint: 'send',
  });
  const submit = button(t('login.send_code'), { type: 'submit', block: true, icon: 'mail' });
  mount(step, h('form', {
    class: 'stack',
    onsubmit: (event) => {
      event.preventDefault();
      const email = emailField.querySelector('input').value.trim().toLowerCase();
      withBusy(submit, async () => {
        await api.sendLoginCode(email);
        showCodeStep(ctx, step, email);
      });
    },
  }, emailField, submit));
  emailField.querySelector('input').focus();
}

function showCodeStep(ctx, step, email) {
  const status = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const otp = otpInput(async (code, reset) => {
    status.textContent = t('login.verifying');
    try {
      await api.verifyLoginCode(email, code);
      await ctx.onSignedIn();
    } finally {
      // Still on screen means the code was wrong (the error toast explains); let them try again.
      if (otp.isConnected) {
        status.textContent = '';
        reset();
      }
    }
  });
  // Not withBusy: that would re-enable the button and cut the new countdown short.
  const resend = button(t('login.resend'), { variant: 'ghost', class: 'btn btn--ghost resend' });
  startResendCountdown(resend);
  resend.addEventListener('click', async () => {
    resend.disabled = true;
    await api.sendLoginCode(email);
    toast(t('login.code_resent'));
    startResendCountdown(resend);
  });

  mount(step,
    h('p', {}, t('login.code_sent', { email })),
    otp,
    status,
    h('div', { class: 'row', style: 'justify-content:center' },
      button(t('login.change_email'), { variant: 'ghost', onclick: () => showEmailStep(ctx, step) }),
      resend));
  otp.querySelector('input').focus();
}

function startResendCountdown(resend) {
  let remaining = RESEND_AFTER_SECONDS;
  const label = resend.lastChild;
  resend.setAttribute('aria-disabled', 'true');
  resend.disabled = true;
  const tick = () => {
    if (!resend.isConnected) return;
    if (remaining === 0) {
      label.textContent = t('login.resend');
      resend.disabled = false;
      resend.removeAttribute('aria-disabled');
      return;
    }
    label.textContent = t('login.resend_in', { seconds: remaining });
    remaining -= 1;
    setTimeout(tick, 1000);
  };
  tick();
}

// Six digit boxes: auto-advance, backspace goes back, paste fills all, submits on the last digit.
function otpInput(onComplete) {
  const boxes = Array.from({ length: OTP_LENGTH }, (_, index) => h('input', {
    class: 'otp__box',
    inputmode: 'numeric',
    autocomplete: index === 0 ? 'one-time-code' : 'off',
    maxlength: index === 0 ? OTP_LENGTH : 1, // the first box accepts a whole autofilled code
    'aria-label': t('login.digit', { index: index + 1, total: OTP_LENGTH }),
  }));
  const group = h('div', { class: 'otp', role: 'group', 'aria-label': t('login.code') }, boxes);

  function reset() {
    for (const box of boxes) { box.value = ''; box.dataset.filled = 'false'; box.disabled = false; }
    group.classList.remove('shake');
    void group.offsetWidth;
    group.classList.add('shake');
    boxes[0].focus();
  }

  function fillFrom(index, digits) {
    digits.split('').slice(0, OTP_LENGTH - index).forEach((digit, offset) => { boxes[index + offset].value = digit; });
    for (const box of boxes) box.dataset.filled = String(box.value !== '');
    const next = boxes.find((box) => box.value === '');
    if (next !== undefined) {
      next.focus();
      return;
    }
    for (const box of boxes) box.disabled = true;
    onComplete(boxes.map((box) => box.value).join(''), reset);
  }

  boxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      box.value = '';
      fillFrom(index, digits);
    });
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && box.value === '' && index > 0) {
        boxes[index - 1].value = '';
        boxes[index - 1].dataset.filled = 'false';
        boxes[index - 1].focus();
      }
    });
    box.addEventListener('paste', (event) => {
      event.preventDefault();
      fillFrom(index, event.clipboardData.getData('text').replace(/\D/g, ''));
    });
  });
  return group;
}
