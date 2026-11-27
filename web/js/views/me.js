// "Me" tab plus the screens for people who are not approved members yet.
import { freshness, pageHeader } from '../components.js';
import { api } from '../api.js';
import { getLang, LANGUAGES, setLang, t } from '../i18n.js';
import { isStale, isUnconfirmed } from '../profile.js';
import { h, toast, withBusy } from '../ui.js';
import { renderProfileForm } from './profile-form.js';

function saveExisting(ctx) {
  return async (profile) => {
    ctx.setMe(await api.updateMyProfile(ctx.state.me.id, profile));
    toast(t('me.saved'));
  };
}

export function renderMe(ctx) {
  const { state } = ctx;
  const confirmButton = h('button', { class: 'button' }, t('me.still_accurate'));
  confirmButton.addEventListener('click', () => withBusy(confirmButton, async () => {
    ctx.setMe(await api.confirmProfile(state.me.id));
    toast(t('me.confirmed'));
  }));

  return h('section', { class: 'page' },
    pageHeader(t('me.title')),
    h('div', { class: isStale(state.me) || isUnconfirmed(state.me) ? 'card card-warning' : 'card' },
      freshness(state.me),
      h('p', { class: 'small' }, t(isUnconfirmed(state.me) ? 'me.unconfirmed_hint' : 'me.freshness_hint')),
      confirmButton),
    renderProfileForm({ member: state.me, email: state.email, submitLabel: t('me.save'), onSave: saveExisting(ctx) }),
    settingsCard(ctx, { allowDelete: true }));
}

export function renderJoin(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('join.title')),
    h('p', {}, t('join.intro')),
    renderProfileForm({
      member: null,
      email: ctx.state.email,
      submitLabel: t('join.submit'),
      onSave: async (profile) => {
        ctx.setMe(await api.createMyProfile(ctx.state.email, profile));
        toast(t('join.sent'));
      },
    }),
    settingsCard(ctx, { allowDelete: false }));
}

export function renderPending(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('pending.title')),
    h('div', { class: 'card card-info' }, h('p', {}, t('pending.body'))),
    renderProfileForm({ member: ctx.state.me, email: ctx.state.email, submitLabel: t('me.save'), onSave: saveExisting(ctx) }),
    settingsCard(ctx, { allowDelete: true }));
}

export function renderRemoved(ctx) {
  return h('section', { class: 'page' },
    pageHeader(t('removed.title')),
    h('p', {}, t('removed.body')),
    settingsCard(ctx, { allowDelete: false }));
}

function settingsCard(ctx, { allowDelete }) {
  return h('div', { class: 'card settings' },
    h('h2', {}, t('settings.title')),
    h('div', { class: 'button-row' },
      LANGUAGES.filter((lang) => lang !== getLang()).map((lang) => h('button', {
        class: 'button button-secondary',
        onclick: () => { setLang(lang); ctx.render(); },
      }, t(`settings.switch_to_${lang}`))),
      installButton(ctx),
      h('button', { class: 'button button-secondary', onclick: () => ctx.signOut() }, t('settings.sign_out'))),
    isIos() && !isStandalone() && h('p', { class: 'muted small' }, t('settings.ios_install_hint')),
    allowDelete && h('button', {
      class: 'button button-danger-ghost',
      onclick: async () => {
        if (!confirm(t('settings.delete_confirm'))) return;
        await api.deleteMyProfile(ctx.state.me.id);
        await ctx.signOut();
      },
    }, t('settings.delete_profile')));
}

function installButton(ctx) {
  if (ctx.state.installPrompt === null) return null;
  return h('button', {
    class: 'button button-secondary',
    onclick: async () => {
      await ctx.state.installPrompt.prompt();
      ctx.state.installPrompt = null;
      ctx.render();
    },
  }, t('settings.install'));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}
