import { api } from '../api.js';
import {
  button, emptyState, linkedinJobsCard, pageHeader, showFieldErrors, textAreaField, textField,
} from '../components.js';
import { firstName, jobReferralText, whatsappLink } from '../contact.js';
import { relativeDays, t } from '../i18n.js';
import { icon } from '../icons.js';
import { daysSince } from '../profile.js';
import { avatar, h, mount, readForm, toast, withBusy } from '../ui.js';

export function renderJobs(ctx) {
  const { state } = ctx;
  const postersById = new Map(state.members.map((member) => [member.id, member]));
  // A job whose poster is no longer an approved member cannot be acted on, so it is not shown.
  const visibleJobs = state.jobs.filter((job) => postersById.has(job.member_id));
  const formSlot = h('div');

  const openForm = button(t('jobs.post'), {
    variant: 'soft',
    block: true,
    icon: 'plus',
    'aria-expanded': 'false',
    onclick: () => {
      openForm.hidden = true;
      mount(formSlot, jobForm(ctx));
      formSlot.querySelector('input[name=title]').focus();
    },
  });

  return h('section', { class: 'page' },
    pageHeader(t('jobs.title')),
    linkedinJobsCard(),
    h('p', { class: 'muted small' }, t('jobs.intro')),
    openForm,
    formSlot,
    visibleJobs.length === 0
      ? emptyState({ title: t('jobs.empty_title'), hint: t('jobs.empty') })
      : h('div', { class: 'results' }, visibleJobs.map((job) => jobCard(ctx, job, postersById.get(job.member_id)))));
}

function jobCard(ctx, job, poster) {
  const { state } = ctx;
  const mine = poster.id === state.me.id;
  const daysLeft = Math.max(0, -daysSince(job.expires_at));
  return h('article', { class: 'card stack' },
    h('div', {},
      h('span', { class: 'overline' }, job.company),
      h('h2', { style: 'font-size:var(--text-lg)' }, job.title)),
    job.details && h('p', { class: 'small prose' }, job.details),
    h('a', { class: 'row', href: `#/m/${poster.id}`, style: 'color:inherit;text-decoration:none' },
      avatar(poster.full_name),
      h('span', { class: 'small' },
        h('strong', {}, poster.full_name), h('br'),
        h('span', { class: 'muted' }, `${t('jobs.posted', { when: relativeDays(daysSince(job.created_at)) })} · ${t('jobs.days_left', { count: daysLeft })}`))),
    h('div', { class: 'row' },
      !mine && poster.phone && button(t('jobs.ask_referral', { name: firstName(poster.full_name) }), {
        tag: 'a',
        variant: 'send',
        icon: 'whatsapp',
        href: whatsappLink(poster.phone, jobReferralText(job, poster, state.me)),
        target: '_blank',
        rel: 'noopener',
      }),
      job.url && button(t('jobs.view_posting'), { tag: 'a', variant: 'ghost', icon: 'external', href: job.url, target: '_blank', rel: 'noopener' }),
      (mine || state.me.is_admin) && button(t('jobs.delete'), {
        variant: 'danger',
        icon: 'trash',
        onclick: async () => {
          if (!confirm(t('jobs.delete_confirm'))) return;
          await api.deleteJob(job.id);
          toast(t('jobs.deleted'));
          await ctx.reloadJobs();
        },
      })));
}

function jobForm(ctx) {
  const { state } = ctx;
  const submit = button(t('jobs.publish'), { type: 'submit', block: true, icon: 'check' });
  const form = h('form', { class: 'card stack', novalidate: true },
    h('h2', { class: 'section-title' }, icon('briefcase', 18), t('jobs.post_title')),
    textField('company', t('jobs.company'), state.me.company, { required: true }),
    textField('title', t('jobs.role'), '', { required: true }),
    textField('url', t('jobs.url'), '', { type: 'url', inputmode: 'url', placeholder: 'https://…' }),
    textAreaField('details', t('jobs.details'), '', { maxlength: 1000 }),
    h('p', { class: 'muted small' }, t('jobs.expiry_hint')),
    submit);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = readForm(form);
    const errors = {};
    if (values.company === '') errors.company = t('jobs.error_company');
    if (values.title === '') errors.title = t('jobs.error_title');
    if (values.url !== '' && !/^https?:\/\//i.test(values.url)) errors.url = t('jobs.error_url');
    showFieldErrors(form, errors);
    if (Object.keys(errors).length > 0) return;
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
  });
  return form;
}
