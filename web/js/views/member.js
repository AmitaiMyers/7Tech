import {
  button, detailsLine, emptyState, freshnessMeta, memberTags, openConnectSheet, pageHeader, roleLine,
} from '../components.js';
import { firstName, profileUrl, vcard } from '../contact.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { emptyFilters } from '../search.js';
import { avatar, downloadFile, h, haptic, toast } from '../ui.js';

// `inSplit`: shown beside the list on desktop, so no back link.
export function renderMember(ctx, memberId, { inSplit = false } = {}) {
  const { state } = ctx;
  const member = state.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    return h('section', { class: 'page' },
      !inSplit && pageHeader(null, '#/'),
      emptyState({ title: t('member.not_found'), hint: t('member.not_found_hint') }));
  }
  const isMe = member.id === state.me.id;
  const role = roleLine(member);
  const details = detailsLine(member);
  const memberJobs = state.jobs.filter((job) => job.member_id === member.id);
  const heroAvatar = avatar(member.full_name, 'lg');
  heroAvatar.style.viewTransitionName = 'person-avatar';

  return h('section', { class: 'page' },
    !inSplit && pageHeader(null, '#/'),
    h('div', { class: 'profile-hero' },
      heroAvatar,
      h('h1', {}, member.full_name),
      role && h('p', {}, role),
      details && h('p', { class: 'muted small' }, details),
      member.education && h('p', { class: 'muted small' }, `🎓 ${member.education}`),
      memberTags(member, { withOffers: false }),
      freshnessMeta(member)),

    isMe
      ? button(t('member.edit_mine'), { tag: 'a', href: '#/me', block: true, icon: 'user' })
      : primaryAction(member, state.me),

    h('div', { class: 'quick-actions' },
      member.linkedin_url && quickAction('linkedin', 'LinkedIn', { tag: 'a', href: member.linkedin_url, target: '_blank', rel: 'noopener' }),
      !isMe && quickAction('mail', t('contact.email'), { tag: 'a', href: `mailto:${member.email}` }),
      !isMe && member.phone && quickAction('phone', t('contact.call'), { tag: 'a', href: `tel:+${member.phone}` }),
      quickAction('contact', t('contact.save_contact'), {
        onclick: () => { downloadFile(`${member.full_name}.vcf`, 'text/vcard', vcard(member)); haptic(); },
      }),
      quickAction('share', t('contact.share'), { onclick: () => shareProfile(member) })),

    member.seeking && section('search', t('member.seeking_title'), h('p', { class: 'prose' }, member.seeking)),
    member.bio && section('user', t('member.about'), h('p', { class: 'prose' }, member.bio)),
    member.offers.length > 0 && section('people', t('member.offers_title', { name: firstName(member.full_name) }),
      h('div', { class: 'row' }, member.offers.map((offer) => h('span', { class: 'tag tag--offer' }, t(`offer.${offer}`))))),
    member.skills.length > 0 && section('briefcase', t('member.skills'),
      h('div', { class: 'row' }, member.skills.map((skill) => h('span', { class: 'tag' }, skill)))),
    memberJobs.length > 0 && section('briefcase', t('member.open_jobs'),
      h('ul', { class: 'bullet-list' }, memberJobs.map((job) => h('li', {}, h('a', { href: '#/jobs' }, `${job.title} · ${job.company}`))))),

    member.company && button(t('common.see_company', { company: member.company }), {
      tag: 'a',
      href: '#/',
      variant: 'ghost',
      block: true,
      icon: 'building',
      onclick: () => { state.filters = { ...emptyFilters(), company: member.company }; },
    }));
}

function primaryAction(member, me) {
  if (!member.phone) return h('p', { class: 'muted small' }, t('member.no_phone'));
  return button(t('member.message', { name: firstName(member.full_name) }), {
    variant: 'send',
    block: true,
    icon: 'whatsapp',
    onclick: () => openConnectSheet(member, me),
  });
}

function quickAction(iconName, label, { tag = 'button', ...attrs }) {
  return h(tag, { class: 'quick-action', type: tag === 'button' ? 'button' : undefined, ...attrs }, icon(iconName, 22), label);
}

function section(iconName, title, body) {
  return h('section', { class: 'card stack' }, h('h2', { class: 'section-title' }, icon(iconName, 18), title), body);
}

async function shareProfile(member) {
  const url = profileUrl(member);
  if (navigator.share) {
    await navigator.share({ title: member.full_name, url });
    return;
  }
  await navigator.clipboard.writeText(url);
  haptic();
  toast(t('contact.link_copied'));
}
