import { api } from '../api.js';
import { detailsLine, emptyState, fieldLabel, freshness, pageHeader, roleLine, seniorityLabel } from '../components.js';
import { nudgeText, whatsappLink } from '../contact.js';
import { isolate, relativeDays, t } from '../i18n.js';
import { daysSince, isStale, isUnconfirmed } from '../profile.js';
import { normalizeText } from '../search.js';
import { groupByCompany } from '../search.js';
import { avatar, downloadFile, h, mount, toast, withBusy } from '../ui.js';

const STALE_LIST_LIMIT = 50;

const CSV_COLUMNS = [
  'full_name', 'course', 'email', 'phone', 'company', 'job_title', 'field', 'seniority', 'location', 'education',
  'linkedin_url', 'bio', 'seeking', 'skills', 'offers', 'contact_prefs', 'looking_for_job', 'status', 'updated_at',
];

export function renderAdmin(ctx) {
  const body = h('div', {}, h('p', { class: 'muted' }, t('common.loading')));
  api.listAllMembers().then((allMembers) => mount(body, adminContent(ctx, allMembers)));
  return h('section', { class: 'page' }, pageHeader(t('admin.title')), body);
}

function adminContent(ctx, allMembers) {
  const pending = allMembers.filter((member) => member.status === 'pending');
  const approved = allMembers.filter((member) => member.status === 'approved');
  const unconfirmed = approved.filter(isUnconfirmed);
  const stale = approved.filter(isStale).sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  // Never-confirmed imports first: at launch this is the "invite people to log in" list.
  const needUpdate = [...unconfirmed, ...stale];

  const changeStatus = (member, status) => async (event) => {
    await withBusy(event.currentTarget, () => api.setMemberStatus(member.id, status));
    await ctx.reloadMembers();
  };

  return [
    h('div', { class: 'stats' },
      stat(t('admin.stat_members'), approved.length),
      stat(t('admin.stat_pending'), pending.length),
      stat(t('admin.stat_looking'), approved.filter((member) => member.looking_for_job).length),
      stat(t('admin.stat_unconfirmed'), unconfirmed.length),
      stat(t('admin.stat_stale'), stale.length)),

    h('div', { class: 'card' },
      h('h2', {}, t('admin.pending_title')),
      pending.length === 0 ? emptyState(t('admin.pending_empty')) : pending.map((member) => adminRow(member,
        h('span', { class: 'muted small' }, `${isolate(member.email)} · ${t('admin.requested', { when: relativeDays(daysSince(member.created_at)) })}`),
        h('div', { class: 'button-row' },
          h('button', { class: 'button', onclick: changeStatus(member, 'approved') }, t('admin.approve')),
          h('button', { class: 'button button-danger-ghost', onclick: changeStatus(member, 'removed') }, t('admin.reject')))))),

    h('div', { class: 'card' },
      h('h2', {}, t('admin.stale_title')),
      h('p', { class: 'muted small' }, t('admin.stale_hint')),
      needUpdate.length === 0 ? emptyState(t('admin.stale_empty')) : needUpdate.slice(0, STALE_LIST_LIMIT).map((member) => adminRow(member,
        freshness(member),
        member.phone && h('a', {
          class: 'button button-secondary',
          href: whatsappLink(member.phone, nudgeText(member, ctx.state.me)),
          target: '_blank',
          rel: 'noopener',
        }, t('admin.nudge'))))),

    allMembersCard(allMembers, changeStatus),

    h('div', { class: 'card' },
      h('h2', {}, t('admin.companies_title')),
      h('p', { class: 'muted small' }, t('admin.companies_hint')),
      h('button', {
        class: 'button button-secondary',
        onclick: async () => {
          await navigator.clipboard.writeText(groupByCompany(approved).map((group) => group.name).join('\n'));
          toast(t('admin.companies_copied'));
        },
      }, t('admin.companies_copy'))),

    h('button', {
      class: 'button button-secondary full',
      onclick: () => downloadFile(`members-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8', toCsv(allMembers)),
    }, t('admin.export_csv')),
  ];
}

function allMembersCard(allMembers, changeStatus) {
  const list = h('div');
  function update(query) {
    const wanted = normalizeText(query);
    const matches = wanted === '' ? [] : allMembers.filter((member) => normalizeText(`${member.full_name} ${member.email}`).includes(wanted));
    mount(list, matches.slice(0, 30).map((member) => adminRow(member,
      h('span', { class: 'muted small' }, `${isolate(member.email)} · ${t(`admin.status_${member.status}`)}`),
      member.status === 'removed'
        ? h('button', { class: 'button button-secondary', onclick: changeStatus(member, 'approved') }, t('admin.restore'))
        : h('button', { class: 'button button-danger-ghost', onclick: changeStatus(member, 'removed') }, t('admin.remove')))));
  }
  return h('div', { class: 'card' },
    h('h2', {}, t('admin.manage_title')),
    h('input', {
      type: 'search',
      class: 'search',
      placeholder: t('admin.manage_placeholder'),
      'aria-label': t('admin.manage_placeholder'),
      oninput: (event) => update(event.target.value),
    }),
    list);
}

function adminRow(member, ...extra) {
  const subtitle = roleLine(member) ?? detailsLine(member);
  return h('div', { class: 'admin-row' },
    avatar(member.full_name, 'sm'),
    h('div', { class: 'admin-row-body' }, h('strong', {}, member.full_name), subtitle && h('span', { class: 'muted small' }, subtitle), ...extra));
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', { class: 'muted small' }, label));
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
