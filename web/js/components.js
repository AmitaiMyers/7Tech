// Reusable view pieces, built on web/css/components.css. See docs/design-system.md for behaviour.
import { LINKEDIN_COMPANIES_JOBS_URL } from './config.js';
import { firstName, messageKinds, messageText, whatsappLink } from './contact.js';
import { isolate, relativeDays, t } from './i18n.js';
import { icon } from './icons.js';
import { daysSince, isStale, isUnconfirmed } from './profile.js';
import { avatar, h, haptic, highlight } from './ui.js';

const MESSAGE_ICONS = {
  hello: '👋', questions: '❓', referrals: '🤝', cv_review: '📄', mock_interview: '🎤', mentoring: '🧭',
};
const SWIPE_CLOSE_PX = 90;

// ── Labels ──

export function fieldLabel(field) {
  return t(`field.${field}`);
}

export function seniorityLabel(seniority) {
  return t(`seniority.${seniority}`);
}

export function roleLine(member) {
  if (member.job_title && member.company) return t('common.role_at', { title: member.job_title, company: member.company });
  return member.job_title ?? member.company; // single value: the paragraph's own direction handles it
}

export function detailsLine(member) {
  const parts = [
    member.field && fieldLabel(member.field),
    member.seniority && seniorityLabel(member.seniority),
    member.location,
  ].filter(Boolean);
  return parts.length === 0 ? null : parts.map(isolate).join(' · ');
}

export function freshnessText(member) {
  if (isUnconfirmed(member)) return t('fresh.unconfirmed');
  const when = relativeDays(daysSince(member.updated_at));
  return isStale(member) ? t('fresh.stale', { when }) : t('fresh.updated', { when });
}

export function freshnessMeta(member) {
  return h('span', { class: isStale(member) ? 'person-card__meta is-stale' : 'person-card__meta' }, freshnessText(member));
}

export function memberTags(member, { withOffers }) {
  const tags = [
    member.course && h('span', { class: 'tag tag--course' }, icon('anchor', 14), t('member.course', { course: member.course })),
    member.looking_for_job && h('span', { class: 'tag tag--looking' }, t('member.looking')),
    ...(withOffers ? member.offers.map((offer) => h('span', { class: 'tag tag--offer' }, t(`offer.${offer}`))) : []),
  ].filter(Boolean);
  return tags.length === 0 ? null : h('div', { class: 'row' }, tags);
}

// ── Buttons & fields ──

// Every button carries an icon slot so loading spinners and success ticks have a place to appear.
export function button(label, {
  icon: iconName = null, emoji = null, variant = null, block = false, list = false, tag = 'button', ...attrs
} = {}) {
  const classes = ['btn', variant && `btn--${variant}`, block && 'btn--block', list && 'btn--list'].filter(Boolean).join(' ');
  return h(tag, { class: classes, type: tag === 'button' ? 'button' : undefined, ...attrs },
    h('span', { class: 'btn__icon' }, iconName ? icon(iconName, 18) : emoji),
    label);
}

function fieldShell(name, label, control, hint) {
  return h('label', { class: 'field', 'data-field': name },
    h('span', { class: 'field__label' }, label),
    control,
    hint && h('span', { class: 'field__hint' }, hint),
    h('span', { class: 'field__error', id: `${name}-error` }));
}

export function textField(name, label, value, { hint = null, ...attrs } = {}) {
  return fieldShell(name, label,
    h('input', { class: 'input', name, id: name, value: value ?? '', 'aria-describedby': `${name}-error`, ...attrs }), hint);
}

export function textAreaField(name, label, value, { hint = null, ...attrs } = {}) {
  return fieldShell(name, label,
    h('textarea', { class: 'input', name, id: name, rows: 3, 'aria-describedby': `${name}-error`, ...attrs }, value ?? ''), hint);
}

export function selectInput(name, options, selected, emptyLabel, attrs = {}) {
  return h('select', { class: 'input', name, id: name, ...attrs },
    h('option', { value: '' }, emptyLabel),
    options.map((option) => h('option', { value: option.value, selected: option.value === selected }, option.label)));
}

export function selectField(name, label, options, selected, emptyLabel) {
  return fieldShell(name, label, selectInput(name, options, selected, emptyLabel, { 'aria-describedby': `${name}-error` }), null);
}

// Marks fields invalid (message under each), shakes the form once and focuses the first problem.
export function showFieldErrors(form, errorsByField) {
  for (const field of form.querySelectorAll('.field[data-invalid="true"]')) {
    field.dataset.invalid = 'false';
    field.querySelector('[aria-invalid]').removeAttribute('aria-invalid');
  }
  const names = Object.keys(errorsByField);
  for (const name of names) {
    const field = form.querySelector(`.field[data-field="${name}"]`);
    if (field === null) throw new Error(`No field "${name}" to show an error on`);
    field.dataset.invalid = 'true';
    field.querySelector('.field__error').textContent = errorsByField[name];
    field.querySelector('input, textarea, select').setAttribute('aria-invalid', 'true');
  }
  if (names.length === 0) return;
  form.classList.remove('shake');
  void form.offsetWidth; // restart the animation
  form.classList.add('shake');
  form.querySelector(`.field[data-field="${names[0]}"] .input`).focus();
}

// ── Page furniture ──

export function pageHeader(title, backHref = null) {
  return h('div', { class: 'page-header' },
    backHref && h('a', { class: 'back-link', href: backHref }, icon('back'), t('common.back')),
    title && h('h1', {}, title));
}

export function emptyState({ title, hint = null, action = null }) {
  return h('div', { class: 'empty' },
    h('div', { class: 'sonar', 'aria-hidden': 'true' }, h('img', { src: 'icons/logo-mark.svg', alt: '' })),
    h('p', {}, h('strong', {}, title)),
    hint && h('p', { class: 'muted small' }, hint),
    action);
}

export function skeletonCards(count) {
  return Array.from({ length: count }, () => h('div', { class: 'card person-card', 'aria-hidden': 'true' },
    h('div', { class: 'avatar skeleton' }),
    h('div', { class: 'person-card__body' },
      h('div', { class: 'skeleton', style: 'height:18px;width:45%' }),
      h('div', { class: 'skeleton', style: 'height:14px;width:75%;margin-top:6px' }),
      h('div', { class: 'skeleton', style: 'height:14px;width:55%;margin-top:6px' }))));
}

// "Jobs at our members' companies" on LinkedIn: find a role there, then ask a member at that company for a referral.
export function linkedinJobsCard() {
  if (LINKEDIN_COMPANIES_JOBS_URL === '') return null;
  return h('div', { class: 'card stack' },
    button(t('linkedin.jobs_button'), { tag: 'a', icon: 'external', block: true, href: LINKEDIN_COMPANIES_JOBS_URL, target: '_blank', rel: 'noopener' }),
    h('p', { class: 'muted small' }, t('linkedin.jobs_hint')));
}

// ── Person card ──

// `tokens` are the current search words (highlighted). onOpen(member) runs before navigating to the profile.
export function personCard(member, me, { tokens = [], current = false, onOpen = () => {} } = {}) {
  const role = roleLine(member);
  const details = detailsLine(member);
  const avatarEl = avatar(member.full_name);
  avatarEl.dataset.memberAvatar = member.id;
  return h('article', { class: 'card person-card', 'aria-current': current ? 'true' : false },
    h('a', { class: 'person-card__main', href: `#/m/${member.id}`, onclick: () => onOpen(member, avatarEl) },
      avatarEl,
      h('div', { class: 'person-card__body' },
        h('span', { class: 'person-card__name' }, highlight(member.full_name, tokens)),
        role && h('span', { class: 'muted' }, highlight(role, tokens)),
        details && h('span', { class: 'muted small' }, details),
        memberTags(member, { withOffers: true }),
        freshnessMeta(member))),
    member.phone && member.id !== me.id && h('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': t('contact.whatsapp_to', { name: member.full_name }),
      onclick: () => openConnectSheet(member, me),
    }, icon('whatsapp', 22)));
}

// ── Connect sheet: choose what to ask → preview the exact WhatsApp text → open WhatsApp ──

export function openConnectSheet(member, me) {
  const titleId = `connect-${member.id}`;
  const preview = h('div', { 'aria-live': 'polite' });
  const send = button(t('connect.open_whatsapp'), { tag: 'a', variant: 'send', block: true, icon: 'whatsapp', 'aria-disabled': 'true', target: '_blank', rel: 'noopener' });
  const askButtons = messageKinds(member).map((kind) => button(t(`contact.ask.${kind}`), {
    variant: 'whatsapp',
    block: true,
    list: true,
    emoji: MESSAGE_ICONS[kind],
    'aria-pressed': 'false',
    onclick: (event) => choose(event.currentTarget, kind),
  }));

  function choose(chosen, kind) {
    for (const askButton of askButtons) askButton.setAttribute('aria-pressed', String(askButton === chosen));
    const text = messageText(kind, member, me);
    preview.replaceChildren(
      h('p', { class: 'overline' }, t('connect.preview')),
      h('div', { class: 'preview-bubble' }, text));
    send.href = whatsappLink(member.phone, text);
    send.setAttribute('aria-disabled', 'false');
    haptic();
  }

  const handle = h('div', { class: 'sheet__handle' }, h('div', { class: 'sheet__grabber', 'aria-hidden': 'true' }));
  const sheet = h('dialog', { class: 'sheet', 'aria-labelledby': titleId },
    handle,
    h('div', { class: 'stack' },
      h('div', { class: 'row' },
        avatar(member.full_name),
        h('div', {},
          h('h2', { id: titleId, class: 'sheet__title' }, t('connect.title', { name: firstName(member.full_name) })),
          member.contact_prefs.length > 0 && h('span', { class: 'muted small' }, t('member.prefers', {
            methods: member.contact_prefs.map((method) => t(`contact_method.${method}`)).join(', '),
          })))),
      h('p', { class: 'muted small' }, t('connect.hint')),
      h('div', { class: 'stack' }, askButtons),
      preview,
      send,
      button(t('common.close'), { variant: 'ghost', block: true, onclick: () => sheet.close() })));

  send.addEventListener('click', (event) => {
    if (send.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    haptic();
    setTimeout(() => sheet.close(), 300);
  });
  sheet.addEventListener('click', (event) => { if (event.target === sheet) sheet.close(); });
  sheet.addEventListener('close', () => sheet.remove());
  enableSwipeToClose(sheet, handle);
  document.body.append(sheet);
  sheet.showModal();
  askButtons[0].focus();
}

function enableSwipeToClose(sheet, handle) {
  let startY = null;
  handle.addEventListener('pointerdown', (event) => {
    startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
    sheet.style.transition = 'none';
  });
  handle.addEventListener('pointermove', (event) => {
    if (startY === null) return;
    sheet.style.transform = `translateY(${Math.max(0, event.clientY - startY)}px)`;
  });
  handle.addEventListener('pointerup', (event) => {
    if (startY === null) return;
    const distance = event.clientY - startY;
    startY = null;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (distance > SWIPE_CLOSE_PX) sheet.close();
  });
}
