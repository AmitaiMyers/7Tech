import { button, emptyState, fieldLabel, personCard, selectInput, seniorityLabel, skeletonCards } from '../components.js';
import { OFFERS } from '../constants.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import {
  distinctValues, emptyFilters, filterMembers, hasActiveFilters, normalizeText, sortByFreshness,
} from '../search.js';
import { h, haptic, mount } from '../ui.js';

const PAGE_SIZE = 60;
const SKELETON_COUNT = 6;

// `currentId` marks the open profile when shown beside the list (desktop split view).
export function renderDirectory(ctx, { currentId = null } = {}) {
  const { state } = ctx;
  const filters = state.filters;
  let visibleCount = PAGE_SIZE;

  const results = h('div', { class: 'results' });
  const count = h('p', { class: 'muted small result-count', 'aria-live': 'polite' });
  const myCourse = state.me.course;
  const moreFilters = h('div', { class: 'more-filters', hidden: !(filters.field || filters.seniority || filters.course) });
  const chipRow = h('div', { class: 'chip-row', role: 'group', 'aria-label': t('directory.filters_label') });

  function searchTokens() {
    return normalizeText(filters.query).split(' ').filter((token) => token !== '');
  }

  function clearAll() {
    Object.assign(filters, emptyFilters());
    ctx.render();
  }

  function update() {
    if (state.loading && state.members.length === 0) {
      count.textContent = t('common.loading');
      mount(results, skeletonCards(SKELETON_COUNT));
      return;
    }
    const matches = sortByFreshness(filterMembers(state.members, filters));
    const tokens = searchTokens();
    count.textContent = t('directory.count', { count: matches.length });
    mount(results,
      matches.length === 0
        ? emptyState({
          title: t('directory.no_results'),
          hint: t('directory.no_results_hint'),
          action: (filters.query || hasActiveFilters(filters)) && button(t('directory.clear_filters'), { variant: 'soft', onclick: clearAll }),
        })
        : matches.slice(0, visibleCount).map((member) => personCard(member, state.me, {
          tokens,
          current: member.id === currentId,
          onOpen: ctx.prepareProfileTransition,
        })),
      matches.length > visibleCount && button(t('directory.show_more', { count: matches.length - visibleCount }), {
        variant: 'soft',
        block: true,
        onclick: () => { visibleCount += PAGE_SIZE; update(); },
      }));
  }

  function refresh() {
    visibleCount = PAGE_SIZE;
    mount(chipRow, chips());
    update();
  }

  function toggleChip(label, isOn, onToggle, extraClass = '') {
    return h('button', {
      type: 'button',
      class: `chip ${extraClass}`.trim(),
      'aria-pressed': String(isOn),
      onclick: () => { onToggle(); haptic(); refresh(); },
    }, label);
  }

  function chips() {
    return [
      filters.company && h('button', {
        type: 'button',
        class: 'chip chip--brass',
        'aria-pressed': 'true',
        onclick: () => { filters.company = ''; refresh(); },
      }, t('directory.company_filter', { company: filters.company }), icon('close', 14)),
      myCourse && toggleChip(t('directory.my_course', { course: myCourse }), filters.course === myCourse, () => {
        filters.course = filters.course === myCourse ? '' : myCourse;
        courseSelect.value = filters.course;
      }, 'chip--brass'),
      toggleChip(t('directory.looking_only'), filters.looking, () => { filters.looking = !filters.looking; }),
      OFFERS.map((offer) => toggleChip(t(`offer.${offer}`), filters.offers.includes(offer), () => {
        filters.offers = filters.offers.includes(offer) ? filters.offers.filter((o) => o !== offer) : [...filters.offers, offer];
      })),
      h('button', {
        type: 'button',
        class: 'chip',
        'aria-expanded': String(!moreFilters.hidden),
        onclick: () => { moreFilters.hidden = !moreFilters.hidden; mount(chipRow, chips()); },
      }, icon('filter', 16), t('directory.more_filters')),
      hasActiveFilters(filters) && h('button', { type: 'button', class: 'chip chip--clear', onclick: clearAll }, t('directory.clear_filters')),
    ];
  }

  const onSelect = (key) => (event) => { filters[key] = event.target.value; refresh(); };
  const courseSelect = selectInput('filter-course',
    distinctValues(state.members, 'course').sort(byCourse).map((value) => ({ value, label: t('member.course', { course: value }) })),
    filters.course, t('directory.any_course'), { 'aria-label': t('form.course'), onchange: onSelect('course') });
  const fieldSelect = selectInput('filter-field',
    distinctValues(state.members, 'field').map((value) => ({ value, label: fieldLabel(value) })).sort(byLabel),
    filters.field, t('directory.any_field'), { 'aria-label': t('form.field'), onchange: onSelect('field') });
  const senioritySelect = selectInput('filter-seniority',
    distinctValues(state.members, 'seniority').map((value) => ({ value, label: seniorityLabel(value) })).sort(byLabel),
    filters.seniority, t('directory.any_seniority'), { 'aria-label': t('form.seniority'), onchange: onSelect('seniority') });
  mount(moreFilters, courseSelect, fieldSelect, senioritySelect);

  const search = h('input', {
    type: 'search',
    class: 'input input--search',
    placeholder: t('directory.search_placeholder'),
    'aria-label': t('directory.search_placeholder'),
    enterkeyhint: 'search',
    value: filters.query,
    oninput: (event) => { filters.query = event.target.value; visibleCount = PAGE_SIZE; update(); },
  });

  mount(chipRow, chips());
  update();
  return h('section', { class: 'page' },
    h('h1', { class: 'visually-hidden' }, t('tabs.people')),
    h('div', { class: 'sticky-search' }, search, chipRow, moreFilters),
    count,
    results);
}

// Numeric-aware so 96 < 105 < 122; text courses (סימולטורית, 132-ח) sort after numbers.
function byCourse(a, b) {
  return a.localeCompare(b, 'he', { numeric: true });
}

function byLabel(a, b) {
  return a.label.localeCompare(b.label);
}
