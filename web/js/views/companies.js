import { emptyState, linkedinJobsCard, pageHeader } from '../components.js';
import { t } from '../i18n.js';
import { companyKey } from '../profile.js';
import { emptyFilters, groupByCompany, normalizeText } from '../search.js';
import { h, mount } from '../ui.js';

export function renderCompanies(ctx) {
  const { state } = ctx;
  const groups = groupByCompany(state.members);
  const jobCounts = countBy(state.jobs.map((job) => companyKey(job.company)));
  const list = h('div', { class: 'company-list' });

  function update(query) {
    const wanted = normalizeText(query);
    const matches = groups.filter((group) => normalizeText(group.name).includes(wanted));
    mount(list, matches.length === 0 ? emptyState(t('companies.no_results')) : matches.map((group) => companyRow(group)));
  }

  function companyRow(group) {
    const looking = group.members.filter((member) => member.looking_for_job).length;
    const referrers = group.members.filter((member) => member.offers.includes('referrals')).length;
    const jobs = jobCounts.get(companyKey(group.name)) ?? 0;
    return h('a', {
      class: 'card company-row',
      href: '#/',
      onclick: () => { state.filters = { ...emptyFilters(), company: group.name }; },
    },
    h('strong', {}, group.name),
    h('span', { class: 'muted small' },
      [
        t('companies.members', { count: group.members.length }),
        referrers > 0 && t('companies.referrers', { count: referrers }),
        jobs > 0 && t('companies.jobs', { count: jobs }),
        looking > 0 && t('companies.looking', { count: looking }),
      ].filter(Boolean).join(' · ')));
  }

  update('');
  return h('section', { class: 'page' },
    pageHeader(t('companies.title')),
    linkedinJobsCard(),
    h('input', {
      type: 'search',
      class: 'search',
      placeholder: t('companies.search_placeholder'),
      'aria-label': t('companies.search_placeholder'),
      oninput: (event) => update(event.target.value),
    }),
    h('p', { class: 'muted small' }, t('companies.count', { count: groups.length })),
    list);
}

function countBy(keys) {
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}
