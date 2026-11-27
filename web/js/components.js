// Reusable view pieces shared by several screens.
import { LINKEDIN_COMPANIES_JOBS_URL } from './config.js';
import { messageKinds, messageText, whatsappLink } from './contact.js';
import { isolate, relativeDays, t } from './i18n.js';
import { daysSince, isStale, isUnconfirmed } from './profile.js';
import { avatar, h } from './ui.js';

const MESSAGE_ICONS = {
  hello: '👋', questions: '❓', referrals: '🤝', cv_review: '📄', mock_interview: '🎤', mentoring: '🧭',
};

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
    member.course && t('member.course', { course: member.course }),
    member.field && fieldLabel(member.field),
    member.seniority && seniorityLabel(member.seniority),
    member.location,
  ].filter(Boolean);
  return parts.length === 0 ? null : parts.map(isolate).join(' · ');
}

export function freshness(member) {
  if (isUnconfirmed(member)) return h('span', { class: 'freshness' }, t('fresh.unconfirmed'));
  const stale = isStale(member);
  return h('span', { class: stale ? 'freshness stale' : 'freshness' },
    stale ? t('fresh.stale', { when: relativeDays(daysSince(member.updated_at)) })
      : t('fresh.updated', { when: relativeDays(daysSince(member.updated_at)) }));
}

export function offerChips(member) {
  if (member.offers.length === 0) return null;
  return h('div', { class: 'chips' }, member.offers.map((offer) => h('span', { class: 'chip chip-offer' }, t(`offer.${offer}`))));
}

export function lookingBadge(member) {
  return member.looking_for_job ? h('span', { class: 'badge badge-looking' }, t('member.looking')) : null;
}

export function memberCard(member, me) {
  const role = roleLine(member);
  const details = detailsLine(member);
  return h('article', { class: 'card member-card' },
    h('a', { class: 'member-card-link', href: `#/m/${member.id}` },
      avatar(member.full_name),
      h('div', { class: 'member-card-body' },
        h('div', { class: 'member-card-title' }, h('strong', {}, member.full_name), lookingBadge(member)),
        role && h('div', { class: 'muted' }, role),
        details && h('div', { class: 'muted small' }, details),
        offerChips(member),
        freshness(member))),
    member.phone && member.id !== me.id && h('a', {
      class: 'icon-button whatsapp',
      href: whatsappLink(member.phone, messageText('hello', member, me)),
      target: '_blank',
      rel: 'noopener',
      'aria-label': t('contact.whatsapp_to', { name: member.full_name }),
    }, whatsappIcon()));
}

export function messageButtons(member, me) {
  return h('div', { class: 'message-list' }, messageKinds(member).map((kind) => h('a', {
    class: 'button button-secondary message-button',
    href: whatsappLink(member.phone, messageText(kind, member, me)),
    target: '_blank',
    rel: 'noopener',
  }, h('span', { 'aria-hidden': 'true' }, MESSAGE_ICONS[kind]), t(`contact.ask.${kind}`))));
}

// "Jobs at our members' companies" on LinkedIn: find a role there, then ask a member at that company for a referral.
export function linkedinJobsCard() {
  if (LINKEDIN_COMPANIES_JOBS_URL === '') return null;
  return h('div', { class: 'card card-info' },
    h('a', { class: 'button full', href: LINKEDIN_COMPANIES_JOBS_URL, target: '_blank', rel: 'noopener' }, t('linkedin.jobs_button')),
    h('p', { class: 'muted small' }, t('linkedin.jobs_hint')));
}

export function pageHeader(title, backHref) {
  return h('div', { class: 'page-header' },
    backHref && h('a', { class: 'back-link', href: backHref, 'aria-label': t('common.back') }, t('common.back_arrow')),
    title && h('h1', {}, title));
}

export function emptyState(message) {
  return h('p', { class: 'empty' }, message);
}

export function selectInput(name, options, selected, emptyLabel) {
  return h('select', { name, id: name },
    h('option', { value: '' }, emptyLabel),
    options.map((option) => h('option', { value: option.value, selected: option.value === selected }, option.label)));
}

export function whatsappIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z');
  svg.append(path);
  return svg;
}
