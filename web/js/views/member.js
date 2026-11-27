import {
  detailsLine, emptyState, freshness, lookingBadge, messageButtons, pageHeader, roleLine,
} from '../components.js';
import { firstName, profileUrl, vcard } from '../contact.js';
import { t } from '../i18n.js';
import { emptyFilters } from '../search.js';
import { avatar, downloadFile, h, toast } from '../ui.js';

export function renderMember(ctx, memberId) {
  const { state } = ctx;
  const member = state.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    return h('section', { class: 'page' }, pageHeader(t('member.not_found'), '#/'), emptyState(t('member.not_found_hint')));
  }
  const isMe = member.id === state.me.id;
  const role = roleLine(member);
  const details = detailsLine(member);
  const memberJobs = state.jobs.filter((job) => job.member_id === member.id);

  return h('section', { class: 'page member-page' },
    pageHeader(null, '#/'),
    h('div', { class: 'profile-hero' },
      avatar(member.full_name, 'lg'),
      h('h1', {}, member.full_name),
      role && h('p', {}, role),
      details && h('p', { class: 'muted' }, details),
      member.education && h('p', { class: 'muted small' }, `🎓 ${member.education}`),
      lookingBadge(member),
      freshness(member)),

    isMe && h('a', { class: 'button full', href: '#/me' }, t('member.edit_mine')),

    member.company && h('a', {
      class: 'button button-ghost full',
      href: '#/',
      onclick: () => filterByCompany(ctx, member.company),
    }, t('common.see_company', { company: member.company })),

    member.seeking && h('div', { class: 'card card-info' },
      h('h2', {}, t('member.seeking_title')),
      h('p', { class: 'bio' }, member.seeking)),

    member.bio && h('div', { class: 'card' }, h('p', { class: 'bio' }, member.bio)),

    member.offers.length > 0 && h('div', { class: 'card' },
      h('h2', {}, t('member.offers_title', { name: firstName(member.full_name) })),
      h('ul', { class: 'offer-list' }, member.offers.map((offer) => h('li', {}, t(`offer.${offer}`))))),

    member.skills.length > 0 && h('div', { class: 'card' },
      h('h2', {}, t('member.skills')),
      h('div', { class: 'chips' }, member.skills.map((skill) => h('span', { class: 'chip' }, skill)))),

    !isMe && h('div', { class: 'card' },
      h('h2', {}, t('member.connect')),
      member.contact_prefs.length > 0 && h('p', { class: 'muted small' }, t('member.prefers', {
        methods: member.contact_prefs.map((method) => t(`contact_method.${method}`)).join(', '),
      })),
      member.phone ? messageButtons(member, state.me) : h('p', { class: 'muted' }, t('member.no_phone')),
      h('div', { class: 'button-row' },
        member.linkedin_url && h('a', { class: 'button button-secondary', href: member.linkedin_url, target: '_blank', rel: 'noopener' }, 'LinkedIn'),
        h('a', { class: 'button button-secondary', href: `mailto:${member.email}` }, t('contact.email')),
        member.phone && h('a', { class: 'button button-secondary', href: `tel:+${member.phone}` }, t('contact.call')))),

    memberJobs.length > 0 && h('div', { class: 'card' },
      h('h2', {}, t('member.open_jobs')),
      h('ul', {}, memberJobs.map((job) => h('li', {}, h('a', { href: '#/jobs' }, `${job.title} · ${job.company}`))))),

    h('div', { class: 'button-row' },
      h('button', {
        class: 'button button-ghost',
        onclick: () => downloadFile(`${member.full_name}.vcf`, 'text/vcard', vcard(member)),
      }, t('contact.save_contact')),
      h('button', { class: 'button button-ghost', onclick: () => shareProfile(member) }, t('contact.share'))));
}

function filterByCompany(ctx, company) {
  ctx.state.filters = { ...emptyFilters(), company };
}

async function shareProfile(member) {
  const url = profileUrl(member);
  if (navigator.share) {
    await navigator.share({ title: member.full_name, url });
    return;
  }
  await navigator.clipboard.writeText(url);
  toast(t('contact.link_copied'));
}
