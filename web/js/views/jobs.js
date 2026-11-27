import { api } from '../api.js';
import { emptyState, linkedinJobsCard, pageHeader } from '../components.js';
import { firstName, jobReferralText, whatsappLink } from '../contact.js';
import { relativeDays, t } from '../i18n.js';
import { daysSince } from '../profile.js';
import { h, mount, readForm, toast, withBusy } from '../ui.js';

export function renderJobs(ctx) {
  const { state } = ctx;
  const postersById = new Map(state.members.map((member) => [member.id, member]));
  // A job whose poster is no longer an approved member cannot be acted on, so it is not shown.
  const visibleJobs = state.jobs.filter((job) => postersById.has(job.member_id));
  const formSlot = h('div');

  const openFormButton = h('button', {
    class: 'button full',
    onclick: () => { openFormButton.hidden = true; mount(formSlot, jobForm(ctx)); },
  }, t('jobs.post'));

  return h('section', { class: 'page' },
    pageHeader(t('jobs.title')),
    linkedinJobsCard(),
    h('p', { class: 'muted' }, t('jobs.intro')),
    openFormButton,
    formSlot,
    visibleJobs.length === 0 ? emptyState(t('jobs.empty'))
      : visibleJobs.map((job) => jobCard(ctx, job, postersById.get(job.member_id))));
}

function jobCard(ctx, job, poster) {
  const { state } = ctx;
  const mine = poster.id === state.me.id;
  const daysLeft = Math.max(0, -daysSince(job.expires_at));
  return h('article', { class: 'card job-card' },
    h('h2', {}, job.title),
    h('p', {}, h('strong', {}, job.company)),
    job.details && h('p', { class: 'small' }, job.details),
    h('p', { class: 'muted small' },
      t('jobs.posted_by', { when: relativeDays(daysSince(job.created_at)) }), ' ',
      h('a', { href: `#/m/${poster.id}` }, poster.full_name),
      ` · ${t('jobs.days_left', { count: daysLeft })}`),
    h('div', { class: 'button-row' },
      !mine && poster.phone && h('a', {
        class: 'button',
        href: whatsappLink(poster.phone, jobReferralText(job, poster, state.me)),
        target: '_blank',
        rel: 'noopener',
      }, t('jobs.ask_referral', { name: firstName(poster.full_name) })),
      job.url && h('a', { class: 'button button-secondary', href: job.url, target: '_blank', rel: 'noopener' }, t('jobs.view_posting')),
      (mine || state.me.is_admin) && h('button', {
        class: 'button button-danger-ghost',
        onclick: async () => {
          if (!confirm(t('jobs.delete_confirm'))) return;
          await api.deleteJob(job.id);
          await ctx.reloadJobs();
        },
      }, t('jobs.delete'))));
}

function jobForm(ctx) {
  const { state } = ctx;
  const submit = h('button', { class: 'button full', type: 'submit' }, t('jobs.publish'));
  const form = h('form', {
    class: 'card profile-form',
    onsubmit: (event) => {
      event.preventDefault();
      const values = readForm(form);
      withBusy(submit, async () => {
        await api.postJob({
          member_id: state.me.id,
          company: values.company,
          title: values.title,
          url: values.url === '' ? null : values.url,
          details: values.details === '' ? null : values.details,
        });
        toast(t('jobs.published'));
        await ctx.reloadJobs();
      });
    },
  },
  h('label', { class: 'field' }, h('span', {}, t('jobs.company')), h('input', { name: 'company', required: true, value: state.me.company ?? '' })),
  h('label', { class: 'field' }, h('span', {}, t('jobs.role')), h('input', { name: 'title', required: true })),
  h('label', { class: 'field' }, h('span', {}, t('jobs.url')), h('input', { name: 'url', type: 'url', placeholder: 'https://…' })),
  h('label', { class: 'field' }, h('span', {}, t('jobs.details')), h('textarea', { name: 'details', rows: 3, maxlength: 1000 })),
  h('p', { class: 'muted small' }, t('jobs.expiry_hint')),
  submit);
  return form;
}
