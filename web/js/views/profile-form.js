// The one profile form, used to join, while pending, and on the "Me" tab.
import { fieldLabel, selectInput, seniorityLabel } from '../components.js';
import {
  BIO_MAX, CONTACT_METHODS, FIELDS, OFFERS, SEEKING_MAX, SENIORITIES,
} from '../constants.js';
import { t } from '../i18n.js';
import { buildProfile } from '../profile.js';
import { h, mount, readForm, withBusy } from '../ui.js';

const EMPTY_PROFILE = {
  full_name: '', course: null, phone: null, linkedin_url: null, company: null, job_title: null, field: null,
  seniority: null, location: null, education: null, bio: null, seeking: null, skills: [], offers: [],
  contact_prefs: [], looking_for_job: false,
};

function checkboxGroup(name, legend, options, checkedValues, labelFor) {
  return h('fieldset', { class: 'field' },
    h('legend', {}, legend),
    options.map((option) => h('label', { class: 'check' },
      h('input', { type: 'checkbox', name, value: option, 'data-group': 'true', checked: checkedValues.includes(option) }),
      labelFor(option))));
}

function textField(name, label, value, attrs = {}) {
  return h('label', { class: 'field' },
    h('span', {}, label),
    h('input', { name, value: value ?? '', ...attrs }));
}

function displayPhone(phone) {
  return phone === null ? '' : `+${phone}`;
}

// onSave(profile) must persist and return the saved member.
export function renderProfileForm({ member, email, submitLabel, onSave }) {
  const values = member ?? EMPTY_PROFILE;
  const errorBox = h('div', { class: 'form-errors', role: 'alert' });
  const submit = h('button', { class: 'button full', type: 'submit' }, submitLabel);

  const form = h('form', {
    class: 'profile-form',
    onsubmit: (event) => {
      event.preventDefault();
      const result = buildProfile(readForm(form));
      if (result.errors) {
        mount(errorBox, h('ul', {}, result.errors.map((key) => h('li', {}, t(key)))));
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      mount(errorBox);
      withBusy(submit, () => onSave(result.profile));
    },
  },
  h('p', { class: 'muted small' }, t('form.email_hint', { email })),
  textField('full_name', t('form.full_name'), values.full_name, { required: true, autocomplete: 'name' }),
  textField('course', t('form.course'), values.course, { placeholder: t('form.course_placeholder') }),
  textField('phone', t('form.phone'), displayPhone(values.phone), { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '050-1234567' }),
  textField('linkedin_url', t('form.linkedin'), values.linkedin_url, { inputmode: 'url', autocomplete: 'url', placeholder: 'linkedin.com/in/…' }),
  textField('company', t('form.company'), values.company, { autocomplete: 'organization' }),
  textField('job_title', t('form.job_title'), values.job_title, { autocomplete: 'organization-title' }),
  h('label', { class: 'field' }, h('span', {}, t('form.field')),
    selectInput('field', FIELDS.map((value) => ({ value, label: fieldLabel(value) })), values.field, t('form.choose'))),
  h('label', { class: 'field' }, h('span', {}, t('form.seniority')),
    selectInput('seniority', SENIORITIES.map((value) => ({ value, label: seniorityLabel(value) })), values.seniority, t('form.choose'))),
  textField('location', t('form.location'), values.location, { placeholder: t('form.location_placeholder') }),
  textField('education', t('form.education'), values.education, { placeholder: t('form.education_placeholder') }),
  textField('skills', t('form.skills'), values.skills.join(', '), { placeholder: t('form.skills_placeholder') }),
  h('label', { class: 'field' }, h('span', {}, t('form.bio')),
    h('textarea', { name: 'bio', rows: 4, maxlength: BIO_MAX, placeholder: t('form.bio_placeholder') }, values.bio ?? '')),
  h('label', { class: 'field' }, h('span', {}, t('form.seeking')),
    h('textarea', { name: 'seeking', rows: 2, maxlength: SEEKING_MAX, placeholder: t('form.seeking_placeholder') }, values.seeking ?? '')),

  checkboxGroup('offers', t('form.offers'), OFFERS, values.offers, (offer) => t(`offer.${offer}`)),
  checkboxGroup('contact_prefs', t('form.contact_prefs'), CONTACT_METHODS, values.contact_prefs, (method) => t(`contact_method.${method}`)),

  h('label', { class: 'check toggle-looking' },
    h('input', { type: 'checkbox', name: 'looking_for_job', checked: values.looking_for_job }),
    h('span', {}, h('strong', {}, t('form.looking')), h('br'), h('span', { class: 'muted small' }, t('form.looking_hint')))),

  errorBox,
  submit);

  return form;
}
