import { emptyState, linkedinJobsCard, pageHeader } from '../components.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { companyKey } from '../profile.js';
import { emptyFilters, groupByCompany, normalizeText } from '../search.js';
import { h, highlight, mount } from '../ui.js';

export function renderCompanies(ctx) {
  const { state } = ctx;
  const groups = groupByCompany(state.members);
  const jobCounts = countBy(state.jobs.map((job) => companyKey(job.company)));
  const list = h('div', { class: 'results' });
  const count = h('p', { class: 'muted small result-count', 'aria-live': 'polite' });

  function update(query) {
    const wanted = normalizeText(query);
    const matches = groups.filter((group) => normalizeText(group.name).includes(wanted));
    count.textContent = t('companies.count', { count: matches.length });
    mount(list, matches.length === 0
      ? emptyState({ title: t('companies.no_results') })
      : matches.map((group) => companyRow(group, wanted === '' ? [] : [wanted])));
  }

  function companyRow(group, tokens) {
    const looking = group.members.filter((member) => member.looking_for_job).length;
    const referrers = group.members.filter((member) => member.offers.includes('referrals')).length;
    const jobs = jobCounts.get(companyKey(group.name)) ?? 0;
    return h('a', {
      class: 'card list-card',
      href: '#/',
      onclick: () => { state.filters = { ...emptyFilters(), company: group.name }; },
    },
    h('span', { class: 'monogram', 'aria-hidden': 'true' }, group.name.trim()[0].toUpperCase()),
    h('span', { class: 'list-card__body' },
      h('strong', {}, highlight(group.name, tokens)),
      h('span', { class: 'muted small' }, [
        t('companies.members', { count: group.members.length }),
        referrers > 0 && t('companies.referrers', { count: referrers }),
        jobs > 0 && t('companies.jobs', { count: jobs }),
        looking > 0 && t('companies.looking', { count: looking }),
      ].filter(Boolean).join(' · '))),
    icon('chevron'));
  }

  update('');
  return h('section', { class: 'page' },
    pageHeader(t('companies.title')),
    linkedinJobsCard(),
    h('input', {
      type: 'search',
      class: 'input input--search',
      placeholder: t('companies.search_placeholder'),
      'aria-label': t('companies.search_placeholder'),
      oninput: (event) => update(event.target.value),
    }),
    count,
    list);
}

function countBy(keys) {
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}
