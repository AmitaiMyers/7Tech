// The one profile form: joining, while pending, and on the "Me" tab.
// Grouped into four sections; errors appear under their field; in edit mode a save bar slides in only
// when something changed (and the app asks before leaving with unsaved changes).
import {
  button, fieldLabel, selectField, seniorityLabel, showFieldErrors, textAreaField, textField,
} from '../components.js';
import {
  BIO_MAX, CONTACT_METHODS, FIELDS, OFFERS, SEEKING_MAX, SENIORITIES,
} from '../constants.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { buildProfile } from '../profile.js';
import { h, readForm, toast, withBusy } from '../ui.js';

const EMPTY_PROFILE = {
  full_name: '', course: null, phone: null, linkedin_url: null, company: null, job_title: null, field: null,
  seniority: null, location: null, education: null, bio: null, seeking: null, skills: [], offers: [],
  contact_prefs: [], looking_for_job: false,
};

// Validation error key → the field it belongs to.
const ERROR_FIELDS = {
  'error.name_required': 'full_name',
  'error.invalid_phone': 'phone',
  'error.invalid_linkedin': 'linkedin_url',
  'error.bio_too_long': 'bio',
  'error.seeking_too_long': 'seeking',
  'error.unknown_field': 'field',
  'error.unknown_seniority': 'seniority',
};

function section(iconName, title, ...fields) {
  return h('fieldset', { class: 'card form-section' },
    h('legend', { class: 'section-title' }, icon(iconName, 18), title),
    fields);
}

function checkboxGroup(name, legend, options, checkedValues, labelFor) {
  return h('fieldset', { class: 'field' },
    h('legend', { class: 'field__label' }, legend),
    options.map((option) => h('label', { class: 'check' },
      h('input', { type: 'checkbox', name, value: option, 'data-group': 'true', checked: checkedValues.includes(option) }),
      labelFor(option))));
}

function displayPhone(phone) {
  return phone === null ? '' : `+${phone}`;
}

// mode: 'create' (join) shows the submit button inline; 'edit' shows a sticky save bar when dirty.
// onSave(profile) persists; onDirtyChange(isDirty) lets the app guard navigation.
export function renderProfileForm({ member, email, mode, submitLabel, onSave, onDirtyChange = () => {} }) {
  const values = member ?? EMPTY_PROFILE;
  const submit = button(submitLabel, { type: 'submit', icon: 'check', block: mode === 'create' });
  const saveBar = h('div', { class: mode === 'create' ? 'save-bar save-bar--inline' : 'save-bar', hidden: mode === 'edit' },
    mode === 'edit' && h('span', { class: 'small muted' }, t('form.unsaved')),
    submit);

  const form = h('form', { class: 'stack', novalidate: true },
    section('user', t('form.section_about'),
      textField('full_name', t('form.full_name'), values.full_name, { required: true, autocomplete: 'name' }),
      textField('course', t('form.course'), values.course, { placeholder: t('form.course_placeholder'), hint: t('form.course_hint') }),
      textField('location', t('form.location'), values.location, { placeholder: t('form.location_placeholder') }),
      textField('education', t('form.education'), values.education, { placeholder: t('form.education_placeholder') }),
      textAreaField('bio', t('form.bio'), values.bio, { rows: 4, maxlength: BIO_MAX, placeholder: t('form.bio_placeholder') })),

    section('briefcase', t('form.section_work'),
      textField('company', t('form.company'), values.company, { autocomplete: 'organization' }),
      textField('job_title', t('form.job_title'), values.job_title, { autocomplete: 'organization-title' }),
      selectField('field', t('form.field'), FIELDS.map((value) => ({ value, label: fieldLabel(value) })), values.field, t('form.choose')),
      selectField('seniority', t('form.seniority'), SENIORITIES.map((value) => ({ value, label: seniorityLabel(value) })), values.seniority, t('form.choose')),
      textField('skills', t('form.skills'), values.skills.join(', '), { placeholder: t('form.skills_placeholder') }),
      textAreaField('seeking', t('form.seeking'), values.seeking, { rows: 2, maxlength: SEEKING_MAX, placeholder: t('form.seeking_placeholder') }),
      h('label', { class: 'switch' },
        h('span', {}, h('strong', {}, t('form.looking')), h('br'), h('span', { class: 'muted small' }, t('form.looking_hint'))),
        h('input', { type: 'checkbox', role: 'switch', name: 'looking_for_job', checked: values.looking_for_job }))),

    section('people', t('form.section_help'),
      checkboxGroup('offers', t('form.offers'), OFFERS, values.offers, (offer) => t(`offer.${offer}`))),

    section('phone', t('form.section_contact'),
      h('p', { class: 'muted small' }, t('form.email_hint', { email })),
      textField('phone', t('form.phone'), displayPhone(values.phone), { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '050-1234567' }),
      textField('linkedin_url', t('form.linkedin'), values.linkedin_url, { inputmode: 'url', autocomplete: 'url', placeholder: 'linkedin.com/in/…' }),
      checkboxGroup('contact_prefs', t('form.contact_prefs'), CONTACT_METHODS, values.contact_prefs, (method) => t(`contact_method.${method}`))),

    saveBar);

  let savedSnapshot = JSON.stringify(readForm(form));
  function refreshDirty() {
    if (mode !== 'edit') return;
    const dirty = JSON.stringify(readForm(form)) !== savedSnapshot;
    saveBar.hidden = !dirty;
    onDirtyChange(dirty);
  }
  form.addEventListener('input', refreshDirty);
  form.addEventListener('change', refreshDirty);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = buildProfile(readForm(form));
    if (result.errors) {
      const byField = {};
      for (const key of result.errors) {
        if (key in ERROR_FIELDS) byField[ERROR_FIELDS[key]] = t(key);
        else toast(t(key));
      }
      showFieldErrors(form, byField);
      return;
    }
    showFieldErrors(form, {});
    withBusy(submit, async () => {
      await onSave(result.profile);
      savedSnapshot = JSON.stringify(readForm(form));
      refreshDirty(); // hides the save bar and clears the leave-page guard
    });
  });

  return form;
}
