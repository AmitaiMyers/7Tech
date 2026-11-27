// Client-side search and filtering. The whole approved directory (hundreds–few thousand rows) is in memory.
import { labelsInAllLanguages } from './i18n.js';
import { companyKey } from './profile.js';

const HEBREW_POINTS = /[֑-ׇ]/g;

export function normalizeText(text) {
  return text.toLowerCase().replace(HEBREW_POINTS, '').replace(/\s+/g, ' ').trim();
}

const haystacks = new WeakMap();

function haystack(member) {
  if (!haystacks.has(member)) {
    const words = [
      member.full_name, member.course, member.company, member.job_title, member.location, member.education,
      member.bio, member.seeking,
      ...member.skills,
      ...(member.field ? labelsInAllLanguages(`field.${member.field}`) : []),
      ...(member.seniority ? labelsInAllLanguages(`seniority.${member.seniority}`) : []),
    ];
    haystacks.set(member, normalizeText(words.filter(Boolean).join(' ')));
  }
  return haystacks.get(member);
}

export function emptyFilters() {
  return { query: '', company: '', course: '', field: '', seniority: '', offers: [], looking: false };
}

export function hasActiveFilters(filters) {
  return filters.company !== '' || filters.course !== '' || filters.field !== '' || filters.seniority !== ''
    || filters.offers.length > 0 || filters.looking;
}

export function filterMembers(members, filters) {
  const tokens = normalizeText(filters.query).split(' ').filter((token) => token !== '');
  const wantedCompany = filters.company === '' ? '' : companyKey(filters.company);
  return members.filter((member) =>
    tokens.every((token) => haystack(member).includes(token))
    && (wantedCompany === '' || (member.company !== null && companyKey(member.company) === wantedCompany))
    && (filters.course === '' || member.course === filters.course)
    && (filters.field === '' || member.field === filters.field)
    && (filters.seniority === '' || member.seniority === filters.seniority)
    && filters.offers.every((offer) => member.offers.includes(offer))
    && (!filters.looking || member.looking_for_job));
}

// Most recently updated first (rewards people who keep their profile fresh);
// profiles not confirmed since the import come last, by name.
export function sortByFreshness(members) {
  return [...members].sort((a, b) => {
    if (a.updated_at === null || b.updated_at === null) {
      return (a.updated_at === null) - (b.updated_at === null) || a.full_name.localeCompare(b.full_name);
    }
    return b.updated_at.localeCompare(a.updated_at);
  });
}

// Distinct non-empty values present in the data, for filter dropdowns.
export function distinctValues(members, key) {
  return [...new Set(members.map((member) => member[key]).filter(Boolean))];
}

export function groupByCompany(members) {
  const groups = new Map();
  for (const member of members) {
    if (member.company === null) continue;
    const key = companyKey(member.company);
    if (!groups.has(key)) groups.set(key, { name: member.company, members: [] });
    groups.get(key).members.push(member);
  }
  return [...groups.values()].sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name));
}
