import { api } from '../api.js';
import {
  button, detailsLine, fieldLabel, freshnessMeta, pageHeader, roleLine, seniorityLabel, skeletonCards,
} from '../components.js';
import { nudgeText, whatsappLink } from '../contact.js';
import { isolate, relativeDays, t } from '../i18n.js';
import { daysSince, isStale, isUnconfirmed } from '../profile.js';
import { icon } from '../icons.js';
import { groupByCompany, normalizeText } from '../search.js';
import { avatar, downloadFile, h, haptic, mount, toast, withBusy } from '../ui.js';

const STALE_LIST_LIMIT = 50;

const CSV_COLUMNS = [
  'full_name', 'course', 'email', 'phone', 'company', 'job_title', 'field', 'seniority', 'location', 'education',
  'linkedin_url', 'bio', 'seeking', 'skills', 'offers', 'contact_prefs', 'looking_for_job', 'status', 'updated_at',
];

export function renderAdmin(ctx) {
  const body = h('div', { class: 'stack' }, skeletonCards(3));
  api.listAllMembers().then((allMembers) => mount(body, adminContent(ctx, allMembers)));
  return h('section', { class: 'page' }, pageHeader(t('admin.title'), '#/me'), body);
}

function adminContent(ctx, allMembers) {
  const pending = allMembers.filter((member) => member.status === 'pending');
  const approved = allMembers.filter((member) => member.status === 'approved');
  const unconfirmed = approved.filter(isUnconfirmed);
  const stale = approved.filter(isStale).sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  // Never-confirmed imports first: at launch this is the "invite people to log in" list.
  const needUpdate = [...unconfirmed, ...stale];

  const changeStatus = (member, status, label, variant) => button(label, {
    variant,
    onclick: (event) => withBusy(event.currentTarget, async () => {
      await api.setMemberStatus(member.id, status);
      await ctx.reloadMembers();
    }),
  });

  return [
    h('div', { class: 'stats' },
      stat(t('admin.stat_members'), approved.length),
      stat(t('admin.stat_pending'), pending.length),
      stat(t('admin.stat_looking'), approved.filter((member) => member.looking_for_job).length),
      stat(t('admin.stat_unconfirmed'), unconfirmed.length),
      stat(t('admin.stat_stale'), stale.length)),

    card('people', t('admin.pending_title'), null,
      pending.length === 0 ? h('p', { class: 'muted small' }, t('admin.pending_empty')) : pending.map((member) => adminRow(member,
        h('span', { class: 'muted small' }, `${isolate(member.email)} · ${t('admin.requested', { when: relativeDays(daysSince(member.created_at)) })}`),
        h('div', { class: 'row' },
          changeStatus(member, 'approved', t('admin.approve'), null),
          changeStatus(member, 'removed', t('admin.reject'), 'danger'))))),

    card('mail', t('admin.stale_title'), t('admin.stale_hint'),
      needUpdate.length === 0 ? h('p', { class: 'muted small' }, t('admin.stale_empty')) : needUpdate.slice(0, STALE_LIST_LIMIT).map((member) => adminRow(member,
        freshnessMeta(member),
        member.phone && h('div', { class: 'row' }, button(t('admin.nudge'), {
          tag: 'a',
          variant: 'whatsapp',
          icon: 'whatsapp',
          href: whatsappLink(member.phone, nudgeText(member, ctx.state.me)),
          target: '_blank',
          rel: 'noopener',
        }))))),

    allMembersCard(allMembers, changeStatus),

    card('building', t('admin.companies_title'), t('admin.companies_hint'),
      h('div', { class: 'row' }, button(t('admin.companies_copy'), {
        variant: 'soft',
        icon: 'copy',
        onclick: async () => {
          await navigator.clipboard.writeText(groupByCompany(approved).map((group) => group.name).join('\n'));
          haptic();
          toast(t('admin.companies_copied'));
        },
      }))),

    button(t('admin.export_csv'), {
      variant: 'ghost',
      block: true,
      icon: 'download',
      onclick: () => downloadFile(`members-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8', toCsv(allMembers)),
    }),
  ];
}

function card(iconName, title, hint, ...content) {
  return h('section', { class: 'card stack' },
    h('h2', { class: 'section-title' }, icon(iconName, 18), title),
    hint && h('p', { class: 'muted small' }, hint),
    h('div', {}, content));
}

function allMembersCard(allMembers, changeStatus) {
  const list = h('div');
  function update(query) {
    const wanted = normalizeText(query);
    const matches = wanted === '' ? [] : allMembers.filter((member) => normalizeText(`${member.full_name} ${member.email}`).includes(wanted));
    mount(list, matches.slice(0, 30).map((member) => adminRow(member,
      h('span', { class: 'muted small' }, `${isolate(member.email)} · ${t(`admin.status_${member.status}`)}`),
      h('div', { class: 'row' }, member.status === 'removed'
        ? changeStatus(member, 'approved', t('admin.restore'), 'soft')
        : changeStatus(member, 'removed', t('admin.remove'), 'danger')))));
  }
  return card('user', t('admin.manage_title'), null,
    h('input', {
      type: 'search',
      class: 'input input--search',
      placeholder: t('admin.manage_placeholder'),
      'aria-label': t('admin.manage_placeholder'),
      oninput: (event) => update(event.target.value),
    }),
    list);
}

function adminRow(member, ...extra) {
  const subtitle = roleLine(member) ?? detailsLine(member);
  return h('div', { class: 'admin-row' },
    avatar(member.full_name),
    h('div', { class: 'admin-row__body' }, h('strong', {}, member.full_name), subtitle && h('span', { class: 'muted small' }, subtitle), ...extra));
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat__value' }, String(value)), h('span', { class: 'muted small' }, label));
}

function csvCell(value) {
  const raw = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  // Member-typed text starting with = + - @ would run as a formula in Excel/Sheets.
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(members) {
  const readable = (member) => ({
    ...member,
    field: member.field && fieldLabel(member.field),
    seniority: member.seniority && seniorityLabel(member.seniority),
  });
  const rows = members.map(readable).map((member) => CSV_COLUMNS.map((column) => csvCell(member[column])).join(','));
  // Byte-order mark so Excel opens Hebrew text correctly.
  return `﻿${[CSV_COLUMNS.join(','), ...rows].join('\r\n')}`;
}
