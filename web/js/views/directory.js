import { emptyState, fieldLabel, memberCard, selectInput, seniorityLabel } from '../components.js';
import { OFFERS } from '../constants.js';
import { t } from '../i18n.js';
import { distinctValues, emptyFilters, filterMembers, hasActiveFilters, sortByFreshness } from '../search.js';
import { h, mount } from '../ui.js';

const PAGE_SIZE = 60;

export function renderDirectory(ctx) {
  const { state } = ctx;
  const filters = state.filters;
  let visibleCount = PAGE_SIZE;

  const results = h('div', { class: 'results' });
  const count = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const myCourse = state.me.course;
  const moreFilters = h('div', { class: 'more-filters', hidden: !(filters.field || filters.seniority || filters.course) });

  function update() {
    const matches = sortByFreshness(filterMembers(state.members, filters));
    count.textContent = t('directory.count', { count: matches.length });
    mount(results,
      matches.length === 0 ? emptyState(t('directory.no_results')) : matches.slice(0, visibleCount).map((m) => memberCard(m, state.me)),
      matches.length > visibleCount && h('button', {
        class: 'button button-secondary full',
        onclick: () => { visibleCount += PAGE_SIZE; update(); },
      }, t('directory.show_more', { count: matches.length - visibleCount })));
  }

  function rerenderChips() {
    mount(chipRow, chips());
  }

  function toggleChip(label, isOn, onToggle) {
    return h('button', {
      type: 'button',
      class: isOn ? 'chip chip-toggle on' : 'chip chip-toggle',
      'aria-pressed': String(isOn),
      onclick: () => { onToggle(); visibleCount = PAGE_SIZE; rerenderChips(); update(); },
    }, label);
  }

  function chips() {
    return [
      filters.company && h('button', {
        type: 'button',
        class: 'chip chip-toggle on',
        onclick: () => { filters.company = ''; rerenderChips(); update(); },
      }, `${t('directory.company_filter', { company: filters.company })} ✕`),
      myCourse && toggleChip(t('directory.my_course', { course: myCourse }), filters.course === myCourse, () => {
        filters.course = filters.course === myCourse ? '' : myCourse;
        courseSelect.value = filters.course;
      }),
      toggleChip(t('directory.looking_only'), filters.looking, () => { filters.looking = !filters.looking; }),
      OFFERS.map((offer) => toggleChip(t(`offer.${offer}`), filters.offers.includes(offer), () => {
        filters.offers = filters.offers.includes(offer) ? filters.offers.filter((o) => o !== offer) : [...filters.offers, offer];
      })),
      toggleChip(t('directory.more_filters'), !moreFilters.hidden, () => { moreFilters.hidden = !moreFilters.hidden; }),
      hasActiveFilters(filters) && h('button', {
        type: 'button',
        class: 'chip chip-clear',
        onclick: () => { Object.assign(filters, emptyFilters(), { query: filters.query }); ctx.render(); },
      }, t('directory.clear_filters')),
    ];
  }

  const chipRow = h('div', { class: 'chip-row' });
  rerenderChips();

  const onSelect = (key) => (event) => { filters[key] = event.target.value; visibleCount = PAGE_SIZE; rerenderChips(); update(); };
  const fieldSelect = selectInput('filter-field',
    distinctValues(state.members, 'field').map((value) => ({ value, label: fieldLabel(value) })).sort(byLabel),
    filters.field, t('directory.any_field'));
  fieldSelect.addEventListener('change', onSelect('field'));
  const senioritySelect = selectInput('filter-seniority',
    distinctValues(state.members, 'seniority').map((value) => ({ value, label: seniorityLabel(value) })).sort(byLabel),
    filters.seniority, t('directory.any_seniority'));
  senioritySelect.addEventListener('change', onSelect('seniority'));
  const courseSelect = selectInput('filter-course',
    distinctValues(state.members, 'course').sort(byCourse).map((value) => ({ value, label: t('member.course', { course: value }) })),
    filters.course, t('directory.any_course'));
  courseSelect.addEventListener('change', onSelect('course'));
  mount(moreFilters, courseSelect, fieldSelect, senioritySelect);

  const search = h('input', {
    type: 'search',
    class: 'search',
    placeholder: t('directory.search_placeholder'),
    'aria-label': t('directory.search_placeholder'),
    value: filters.query,
    oninput: (event) => { filters.query = event.target.value; visibleCount = PAGE_SIZE; update(); },
  });

  update();
  return h('section', { class: 'page' },
    h('div', { class: 'sticky-search' }, search, chipRow, moreFilters),
    count,
    results);
}

// Numeric-aware so 96 < 105 < 122; Hebrew-letter courses (נג, לט…) sort after numbers.
function byCourse(a, b) {
  return a.localeCompare(b, 'he', { numeric: true });
}

function byLabel(a, b) {
  return a.label.localeCompare(b.label);
}
