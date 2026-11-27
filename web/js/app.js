// App shell: state, routing, data loading and the bottom tab bar.
import { api, isDemo } from './api.js';
import { applyLang, friendlyError, t } from './i18n.js';
import { emptyFilters } from './search.js';
import { h, mount, toast } from './ui.js';
import { renderAdmin } from './views/admin.js';
import { renderCompanies } from './views/companies.js';
import { renderDirectory } from './views/directory.js';
import { renderJobs } from './views/jobs.js';
import { renderLogin } from './views/login.js';
import { renderMember } from './views/member.js';
import { renderJoin, renderMe, renderPending, renderRemoved } from './views/me.js';

// Cached directory for instant start-up and offline use. Cleared on sign-out.
const CACHE_KEY = 'directory-cache-v1';

const state = {
  email: null,
  me: null,
  members: [],
  jobs: [],
  filters: emptyFilters(),
  installPrompt: null,
  directoryScroll: 0,
  currentRoute: null,
};

const root = document.getElementById('app');

const ctx = {
  state,
  render,
  setMe(member) {
    state.me = member;
    state.members = state.members.map((existing) => (existing.id === member.id ? member : existing));
    render();
  },
  async onSignedIn() {
    state.email = await api.currentEmail();
    await loadSignedIn();
  },
  async signOut() {
    await api.signOut();
    localStorage.removeItem(CACHE_KEY);
    Object.assign(state, { email: null, me: null, members: [], jobs: [], filters: emptyFilters() });
    history.replaceState(null, '', '#/'); // no hashchange event, so render() runs once
    render();
  },
  async reloadMembers() {
    state.members = await api.listMembers();
    writeCache();
    render();
  },
  async reloadJobs() {
    state.jobs = await api.listJobs();
    writeCache();
    render();
  },
};

// ───────────── Routing ─────────────

const ROUTES = [
  { pattern: /^#\/m\/([\w-]+)$/, name: 'member', view: (match) => renderMember(ctx, match[1]) },
  { pattern: /^#\/companies$/, name: 'companies', view: () => renderCompanies(ctx) },
  { pattern: /^#\/jobs$/, name: 'jobs', view: () => renderJobs(ctx) },
  { pattern: /^#\/me$/, name: 'me', view: () => renderMe(ctx) },
  { pattern: /^#\/admin$/, name: 'admin', view: () => renderAdmin(ctx), adminOnly: true },
];
const DIRECTORY_ROUTE = { name: 'directory', view: () => renderDirectory(ctx) };

function currentRoute() {
  for (const route of ROUTES) {
    const match = location.hash.match(route.pattern);
    if (match && (!route.adminOnly || state.me.is_admin)) return { route, match };
  }
  return { route: DIRECTORY_ROUTE, match: null };
}

function render() {
  applyLang();
  if (state.currentRoute === 'directory') state.directoryScroll = window.scrollY;

  if (state.email === null) return show('login', renderLogin(ctx), false);
  if (state.me === null) return show('join', renderJoin(ctx), false);
  if (state.me.status === 'pending') return show('pending', renderPending(ctx), false);
  if (state.me.status === 'removed') return show('removed', renderRemoved(ctx), false);

  const { route, match } = currentRoute();
  show(route.name, route.view(match), true);
  window.scrollTo(0, route.name === 'directory' ? state.directoryScroll : 0);
}

function show(routeName, page, withTabs) {
  state.currentRoute = routeName;
  mount(root,
    header(),
    h('main', { id: 'main' }, page),
    withTabs && tabBar(routeName));
}

function header() {
  return h('header', { class: 'app-header' },
    h('a', { class: 'brand', href: '#/' }, h('img', { src: 'icons/icon.svg', alt: '', width: 28, height: 28 }), t('app.name')),
    isDemo && h('span', { class: 'badge badge-demo' }, t('app.demo')),
    !navigator.onLine && h('span', { class: 'badge badge-offline' }, t('app.offline')));
}

function tabBar(activeRoute) {
  const tabs = [
    { href: '#/', route: 'directory', icon: '👥', label: t('tabs.people') },
    { href: '#/companies', route: 'companies', icon: '🏢', label: t('tabs.companies') },
    { href: '#/jobs', route: 'jobs', icon: '💼', label: t('tabs.jobs') },
    { href: '#/me', route: 'me', icon: '🙂', label: t('tabs.me') },
    state.me.is_admin && { href: '#/admin', route: 'admin', icon: '🛠️', label: t('tabs.admin') },
  ].filter(Boolean);
  return h('nav', { class: 'tab-bar', 'aria-label': t('tabs.label') },
    tabs.map((tab) => h('a', {
      href: tab.href,
      class: tab.route === activeRoute || (tab.route === 'directory' && activeRoute === 'member') ? 'tab active' : 'tab',
      'aria-current': tab.route === activeRoute ? 'page' : false,
    }, h('span', { 'aria-hidden': 'true' }, tab.icon), h('span', {}, tab.label))));
}

// ───────────── Data ─────────────

function readCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw === null) return;
  const cache = JSON.parse(raw);
  if (cache.email !== state.email) return;
  state.members = cache.members;
  state.jobs = cache.jobs;
}

function writeCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ email: state.email, members: state.members, jobs: state.jobs }));
}

async function loadSignedIn() {
  readCache();
  if (state.members.length > 0) {
    state.me = state.members.find((member) => member.email === state.email) ?? null;
    if (state.me !== null) render(); // instant render from cache, refreshed below
  }
  if (!navigator.onLine && state.me !== null) return;

  state.me = await api.getMyProfile(state.email);
  if (state.me !== null && state.me.status === 'approved') {
    [state.members, state.jobs] = await Promise.all([api.listMembers(), api.listJobs()]);
    writeCache();
  }
  render();
}

async function boot() {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason.name === 'AbortError') return; // e.g. the user closed the share sheet
    toast(friendlyError(event.reason.message));
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.installPrompt = event;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

  state.email = await api.currentEmail();
  if (state.email === null) {
    render();
    return;
  }
  await loadSignedIn();
}

boot();
