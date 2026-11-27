// "Me" tab, the launch-day "Is this you?" step, and the screens for people who are not approved yet.
import { api } from '../api.js';
import { button, freshnessText, pageHeader, personCard } from '../components.js';
import { getLang, LANGUAGES, setLang, t } from '../i18n.js';
import { icon } from '../icons.js';
import { isStale, isUnconfirmed } from '../profile.js';
import { getTheme, setTheme, THEMES } from '../theme.js';
import { h, haptic, mount, toast, withBusy } from '../ui.js';
import { renderProfileForm } from './profile-form.js';

const THEME_ICONS = { system: 'auto', light: 'sun', dark: 'moon' };

export function renderMe(ctx) {
  const { state } = ctx;
  const freshnessCard = h('div');

  function paintFreshness() {
    const needsAttention = isStale(state.me) || isUnconfirmed(state.me);
    const confirm = button(t('me.still_accurate'), { icon: 'check', variant: needsAttention ? null : 'soft' });
    confirm.addEventListener('click', () => withBusy(confirm, async () => {
      ctx.setMe(await api.confirmProfile(state.me.id), { rerender: false });
      toast(t('me.confirmed'));
      setTimeout(paintFreshness, 1200); // after the ✓ has shown
    }));
    mount(freshnessCard, h('div', { class: needsAttention ? 'card stack card--attention' : 'card stack' },
      h('p', { class: needsAttention ? 'overline is-stale' : 'overline' }, freshnessText(state.me)),
      h('p', { class: 'small' }, t(isUnconfirmed(state.me) ? 'me.unconfirmed_hint' : 'me.freshness_hint')),
      h('div', { class: 'row' }, confirm,
        button(t('me.view_public'), { tag: 'a', href: `#/m/${state.me.id}`, variant: 'ghost', icon: 'user' }))));
  }
  paintFreshness();

  return h('section', { class: 'page' },
    pageHeader(t('me.title')),
    freshnessCard,
    renderProfileForm({
      member: state.me,
      email: state.email,
      mode: 'edit',
      submitLabel: t('me.save'),
      onDirtyChange: ctx.setDirty,
      onSave: async (profile) => {
        ctx.setMe(await api.updateMyProfile(state.me.id, profile), { rerender: false });
        toast(t('me.saved'));
        paintFreshness();
      },
    }),
    settingsCard(ctx, { allowDelete: true }));
}

// Shown once after login to members imported from the old sheet: confirm in one tap, or edit.
export function renderConfirm(ctx) {
  const { state } = ctx;
  const looksRight = button(t('confirm.looks_right'), { icon: 'check', block: true });
  looksRight.addEventListener('click', () => withBusy(looksRight, async () => {
    const updated = await api.confirmProfile(state.me.id);
    toast(t('me.confirmed'));
    ctx.setMe(updated);
  }));
  return h('section', { class: 'page' },
    h('div', { class: 'stack', style: 'text-align:center;align-items:center' },
      h('span', { class: 'overline' }, t('confirm.overline')),
      h('h1', {}, t('confirm.title')),
      h('p', { class: 'muted' }, t('confirm.body'))),
    personCard(state.me, state.me),
    looksRight,
    button(t('confirm.edit'), {
      tag: 'a', href: '#/me', variant: 'soft', block: true, icon: 'user',
      onclick: () => { state.confirmDismissed = true; },
    }),
    button(t('confirm.later'), {
      variant: 'ghost', block: true,
      onclick: () => { state.confirmDismissed = true; ctx.render(); },
    }));
}

export function renderJoin(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('join.title')),
    h('p', {}, t('join.intro')),
    renderProfileForm({
      member: null,
      email: ctx.state.email,
      mode: 'create',
      submitLabel: t('join.submit'),
      onSave: async (profile) => {
        const created = await api.createMyProfile(ctx.state.email, profile);
        toast(t('join.sent'));
        ctx.setMe(created);
      },
    }),
    settingsCard(ctx, { allowDelete: false }));
}

export function renderPending(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('pending.title')),
    h('div', { class: 'card card--info' }, h('p', {}, t('pending.body'))),
    renderProfileForm({
      member: ctx.state.me,
      email: ctx.state.email,
      mode: 'create',
      submitLabel: t('me.save'),
      onSave: async (profile) => {
        ctx.setMe(await api.updateMyProfile(ctx.state.me.id, profile), { rerender: false });
        toast(t('me.saved'));
      },
    }),
    settingsCard(ctx, { allowDelete: true }));
}

export function renderRemoved(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('removed.title')),
    h('p', {}, t('removed.body')),
    settingsCard(ctx, { allowDelete: false }));
}

function segmented(label, options) {
  return h('div', { class: 'segmented', role: 'group', 'aria-label': label }, options);
}

export function languageSwitch(ctx) {
  return segmented(t('settings.language'), LANGUAGES.map((lang) => h('button', {
    type: 'button',
    class: 'chip',
    lang,
    'aria-pressed': String(lang === getLang()),
    onclick: () => { setLang(lang); haptic(); ctx.render(); },
  }, t(`settings.switch_to_${lang}`))));
}

function themeSwitch(ctx) {
  return segmented(t('settings.theme'), THEMES.map((theme) => h('button', {
    type: 'button',
    class: 'chip',
    'aria-pressed': String(theme === getTheme()),
    onclick: () => { setTheme(theme); haptic(); ctx.render(); },
  }, icon(THEME_ICONS[theme], 16), t(`settings.theme_${theme}`))));
}

function settingsCard(ctx, { allowDelete }) {
  const { state } = ctx;
  return h('section', { class: 'card' },
    h('h2', { class: 'section-title' }, icon('tools', 18), t('settings.title')),
    h('div', { class: 'settings-row' }, h('span', {}, t('settings.theme')), themeSwitch(ctx)),
    h('div', { class: 'settings-row' }, h('span', {}, t('settings.language')), languageSwitch(ctx)),
    state.installPrompt !== null && h('div', { class: 'settings-row' },
      h('span', {}, t('settings.install_label')),
      button(t('settings.install'), {
        variant: 'soft',
        icon: 'install',
        onclick: async () => { await state.installPrompt.prompt(); state.installPrompt = null; ctx.render(); },
      })),
    isIos() && !isStandalone() && h('p', { class: 'muted small settings-row' }, t('settings.ios_install_hint')),
    state.me !== null && state.me.is_admin && state.me.status === 'approved'
      && h('a', { class: 'link-row settings-row', href: '#/admin' }, icon('tools'), t('settings.admin_tools'), icon('chevron')),
    h('button', { type: 'button', class: 'link-row settings-row btn-reset', onclick: () => ctx.signOut() }, icon('logout'), t('settings.sign_out')),
    allowDelete && h('button', {
      type: 'button',
      class: 'link-row settings-row btn-reset is-danger',
      onclick: async () => {
        if (!confirm(t('settings.delete_confirm'))) return;
        await api.deleteMyProfile(state.me.id);
        await ctx.signOut();
      },
    }, icon('trash'), t('settings.delete_profile')));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}
