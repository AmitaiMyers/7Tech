// App shell: state, routing, data loading, the persistent tab bar / rail, and screen transitions.
import { api, isDemo } from './api.js';
import { emptyState } from './components.js';
import { applyLang, friendlyError, t } from './i18n.js';
import { icon } from './icons.js';
import { isUnconfirmed } from './profile.js';
import { emptyFilters } from './search.js';
import { applyTheme } from './theme.js';
import { h, mount, toast } from './ui.js';
import { renderAdmin } from './views/admin.js';
import { renderCompanies } from './views/companies.js';
import { renderDirectory } from './views/directory.js';
import { renderJobs } from './views/jobs.js';
import { renderLogin } from './views/login.js';
import { renderMember } from './views/member.js';
import {
  renderConfirm, renderJoin, renderMe, renderPending, renderRemoved,
} from './views/me.js';

// Cached directory for instant start-up and offline use. Cleared on sign-out.
const CACHE_KEY = 'directory-cache-v2';
const AVATAR_TRANSITION_NAME = 'person-avatar';
const wideScreen = window.matchMedia('(min-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  email: null,
  me: null,
  members: [],
  jobs: [],
  loading: false,
  filters: emptyFilters(),
  installPrompt: null,
  confirmDismissed: false,
  dirty: false,
  currentHash: location.hash,
  currentRoute: null,
  directoryScroll: 0,
  lastMemberId: null,
  navigating: false, // true while rendering a hash change (vs. a data refresh)
};

const ctx = {
  state,
  render,
  setMe(member, { rerender = true } = {}) {
    state.me = member;
    state.members = state.members.map((existing) => (existing.id === member.id ? member : existing));
    writeCache();
    if (rerender) render();
  },
  setDirty(dirty) {
    state.dirty = dirty;
  },
  // Gives the tapped card's avatar the shared transition name, so it glides into the profile header.
  prepareProfileTransition(member, avatarEl) {
    clearAvatarTransitionNames();
    avatarEl.style.viewTransitionName = AVATAR_TRANSITION_NAME;
    state.lastMemberId = member.id;
  },
  async onSignedIn() {
    state.email = await api.currentEmail();
    await loadSignedIn();
  },
  async signOut() {
    await api.signOut();
    localStorage.removeItem(CACHE_KEY);
    Object.assign(state, { email: null, me: null, members: [], jobs: [], filters: emptyFilters(), confirmDismissed: false, dirty: false });
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

// ───────────── Shell ─────────────

const root = document.getElementById('app');
const headerSlot = h('div');
const main = h('main', { id: 'main' });
const tabbar = createTabbar();
mount(root, headerSlot, main, tabbar.element);

const TABS = [
  { route: 'directory', href: '#/', icon: 'people', label: 'tabs.people' },
  { route: 'companies', href: '#/companies', icon: 'building', label: 'tabs.companies' },
  { route: 'jobs', href: '#/jobs', icon: 'briefcase', label: 'tabs.jobs' },
  { route: 'me', href: '#/me', icon: 'user', label: 'tabs.me' },
];
// Inner screens light up their parent tab.
const TAB_FOR_ROUTE = { directory: 'directory', member: 'directory', companies: 'companies', jobs: 'jobs', me: 'me', admin: 'me' };

function createTabbar() {
  const indicator = h('span', { class: 'tabbar__indicator', 'aria-hidden': 'true' });
  const element = h('nav', { class: 'tabbar app-tabbar' }, indicator);
  let links = [];

  function build() {
    links = TABS.map((tab) => h('a', {
      class: 'tabbar__tab',
      href: tab.href,
      'data-route': tab.route,
      onclick: (event) => {
        if (event.currentTarget.getAttribute('aria-current') !== 'page') return;
        event.preventDefault(); // tapping the current tab scrolls to the top
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      },
    }, icon(tab.icon, 22), h('span', {}, t(tab.label))));
    element.setAttribute('aria-label', t('tabs.label'));
    mount(element, indicator, links);
  }

  function update(route) {
    const activeRoute = TAB_FOR_ROUTE[route];
    for (const link of links) {
      if (link.dataset.route === activeRoute) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    requestAnimationFrame(() => placeIndicator(links.find((link) => link.dataset.route === activeRoute)));
  }

  function placeIndicator(active) {
    const bar = element.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    const width = Math.min(64, tab.width - 16);
    const fromStart = document.documentElement.dir === 'rtl' ? bar.right - tab.right : tab.left - bar.left;
    indicator.style.width = `${width}px`;
    indicator.style.insetInlineStart = `${fromStart + (tab.width - width) / 2}px`;
  }

  return { element, build, update };
}

function header() {
  return h('header', { class: 'app-header' },
    h('a', { class: 'brand', href: '#/', 'aria-label': t('app.home') },
      h('img', { src: 'icons/logo-mark.svg', alt: '' }),
      h('span', { class: 'wordmark' }, t('app.name'))),
    isDemo && h('span', { class: 'tag tag--stale' }, t('app.demo')),
    !navigator.onLine && h('span', { class: 'tag' }, t('app.offline')));
}

// ───────────── Routing ─────────────

const ROUTES = [
  { pattern: /^#\/m\/([\w-]+)$/, name: 'member' },
  { pattern: /^#\/companies$/, name: 'companies' },
  { pattern: /^#\/jobs$/, name: 'jobs' },
  { pattern: /^#\/me$/, name: 'me' },
  { pattern: /^#\/admin$/, name: 'admin', adminOnly: true },
];

function currentRoute() {
  for (const route of ROUTES) {
    const match = location.hash.match(route.pattern);
    if (match && (!route.adminOnly || state.me.is_admin)) return { name: route.name, param: match[1] };
  }
  return { name: 'directory', param: null };
}

const VIEWS = {
  directory: () => renderDirectory(ctx),
  member: (param) => renderMember(ctx, param),
  companies: () => renderCompanies(ctx),
  jobs: () => renderJobs(ctx),
  me: () => renderMe(ctx),
  admin: () => renderAdmin(ctx),
};

function render() {
  applyLang();
  applyTheme();
  mount(headerSlot, header());
  tabbar.build();
  if (state.currentRoute === 'directory' && !wideScreen.matches) state.directoryScroll = window.scrollY;

  if (state.email === null) {
    mount(headerSlot); // the login hero carries the brand
    return showPage('login', renderLogin(ctx));
  }
  if (state.me === null) return showPage('join', renderJoin(ctx));
  if (state.me.status === 'pending') return showPage('pending', renderPending(ctx));
  if (state.me.status === 'removed') return showPage('removed', renderRemoved(ctx));

  const route = currentRoute();
  if (route.name === 'directory' && isUnconfirmed(state.me) && !state.confirmDismissed) {
    return showPage('confirm', renderConfirm(ctx));
  }
  if (wideScreen.matches && (route.name === 'directory' || route.name === 'member')) return showSplit(route);
  showPage(route.name, VIEWS[route.name](route.param), { tabs: true });
  window.scrollTo(0, route.name === 'directory' ? state.directoryScroll : 0);
}

function showPage(routeName, page, { tabs = false } = {}) {
  state.currentRoute = routeName;
  main.className = tabs ? '' : 'no-tabs';
  mount(main, page);
  tabbar.element.hidden = !tabs;
  if (tabs) tabbar.update(routeName);
}

// Desktop People: list and profile side by side. Selecting someone replaces only the profile pane,
// so the list keeps its scroll position and search box.
function showSplit(route) {
  const currentId = route.name === 'member' ? route.param : null;
  const detail = currentId === null
    ? emptyState({ title: t('directory.pick_someone'), hint: t('directory.pick_someone_hint') })
    : renderMember(ctx, currentId, { inSplit: true });
  const existingList = main.querySelector('.split__list');
  // Reuse the list only when moving between people; data refreshes rebuild it.
  if (state.navigating && state.currentRoute === 'split' && existingList !== null) {
    for (const link of existingList.querySelectorAll('.person-card__main')) {
      link.closest('.person-card').setAttribute('aria-current', String(link.getAttribute('href') === `#/m/${currentId}`));
    }
    mount(main.querySelector('.split__detail'), detail);
  } else {
    state.currentRoute = 'split';
    main.className = 'is-split';
    mount(main, h('div', { class: 'split-view' },
      h('div', { class: 'split__list' }, renderDirectory(ctx, { currentId })),
      h('div', { class: 'split__detail' }, detail)));
  }
  tabbar.element.hidden = false;
  tabbar.update(route.name);
}

function clearAvatarTransitionNames() {
  for (const el of document.querySelectorAll('[data-member-avatar]')) el.style.viewTransitionName = '';
}

// Screen changes animate with the View Transitions API where available (not on desktop split, not under
// reduced motion). Coming back to the list, the avatar glides from the profile into its card.
function navigate() {
  if (state.dirty && state.currentHash !== location.hash) {
    if (!confirm(t('form.discard_confirm'))) {
      history.replaceState(null, '', state.currentHash);
      return;
    }
    state.dirty = false;
  }
  state.currentHash = location.hash;
  state.navigating = true;
  requestAnimationFrame(() => { state.navigating = false; });
  const animate = 'startViewTransition' in document && !reducedMotion.matches && !wideScreen.matches;
  if (!animate) {
    render();
    return;
  }
  const transition = document.startViewTransition(() => {
    render();
    const card = state.lastMemberId && main.querySelector(`[data-member-avatar="${state.lastMemberId}"]`);
    if (card) card.style.viewTransitionName = AVATAR_TRANSITION_NAME;
  });
  transition.finished.then(clearAvatarTransitionNames);
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
  if (state.email === null) return;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ email: state.email, members: state.members, jobs: state.jobs }));
}

async function loadSignedIn() {
  readCache();
  const cachedMe = state.members.find((member) => member.email === state.email);
  if (cachedMe !== undefined) {
    state.me = cachedMe;
    render(); // instant from cache; refreshed below
  }
  if (!navigator.onLine && state.me !== null) return;

  state.me = await api.getMyProfile(state.email);
  if (state.me === null || state.me.status !== 'approved') {
    render();
    return;
  }
  state.loading = true;
  if (cachedMe === undefined) render(); // skeleton cards while the directory loads
  [state.members, state.jobs] = await Promise.all([api.listMembers(), api.listJobs()]);
  state.loading = false;
  writeCache();
  render();
}

async function boot() {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason.name === 'AbortError') return; // e.g. the user closed the share sheet
    toast(friendlyError(event.reason.message));
  });
  window.addEventListener('hashchange', navigate);
  // Only the header badge changes; re-rendering the page would wipe a half-filled form.
  window.addEventListener('online', () => mount(headerSlot, header()));
  window.addEventListener('offline', () => mount(headerSlot, header()));
  wideScreen.addEventListener('change', render);
  window.addEventListener('beforeunload', (event) => { if (state.dirty) event.preventDefault(); });
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.installPrompt = event;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

  applyTheme();
  state.email = await api.currentEmail();
  if (state.email === null) {
    render();
    return;
  }
  await loadSignedIn();
}

boot();
