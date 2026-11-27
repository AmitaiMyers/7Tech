// Profile rules shared by the edit form, the cards and the admin screen.
// Keep normalizePhone / normalizeLinkedin in sync with scripts/import_sheet.py.
import {
  BIO_MAX, CONTACT_METHODS, FIELDS, OFFERS, SEEKING_MAX, SENIORITIES, STALE_AFTER_DAYS,
} from './constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Normalizers return { value } (value is null when the input is empty) or { invalid: true }.

export function normalizePhone(raw) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits === '') return { value: null };
  let international = digits.replace(/^\+/, '').replace(/^00/, '');
  if (international.startsWith('0')) international = '972' + international.slice(1);
  return /^\d{8,15}$/.test(international) ? { value: international } : { invalid: true };
}

export function normalizeLinkedin(raw) {
  if (raw === '') return { value: null };
  const withScheme = /^https?:\/\//i.test(raw) ? raw.replace(/^http:/i, 'https:') : `https://${raw}`;
  return /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(withScheme) ? { value: withScheme } : { invalid: true };
}

// Hebrew numerals (gematria). Final letters count like their regular forms.
const HEBREW_LETTER_VALUES = Object.fromEntries([...'אבגדהוזחטיכךלמםנןסעפףצץקרשת'].map((letter, index) => [
  letter,
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 20, 30, 40, 40, 50, 50, 60, 70, 80, 80, 90, 90, 100, 200, 300, 400][index],
]));

// Same rules as normalize_course in scripts/import_sheet.py: a Hebrew numeral (נג, פ"ז, ס׳) becomes its number;
// anything else (115, 132-ח, סימולטורית) is kept as written. A numeral has 1–4 letters in non-increasing value.
export function normalizeCourse(raw) {
  const text = raw.trim();
  const letters = text.replace(/["'׳״]/g, '');
  if (/^[א-ת]{1,4}$/.test(letters)) {
    const values = [...letters].map((letter) => HEBREW_LETTER_VALUES[letter]);
    if (values.every((value, index) => index === 0 || values[index - 1] >= value)) {
      return String(values.reduce((sum, value) => sum + value, 0));
    }
  }
  return text;
}

export function parseSkills(raw) {
  return [...new Set(raw.split(/[,،\n]/).map((s) => s.trim()).filter((s) => s !== ''))];
}

// Converts raw form values into a database row. Returns { profile } or { errors: [i18n keys] }.
export function buildProfile(form) {
  const errors = [];
  if (form.full_name === '') errors.push('error.name_required');
  if (form.field !== '' && !FIELDS.includes(form.field)) errors.push('error.unknown_field');
  if (form.seniority !== '' && !SENIORITIES.includes(form.seniority)) errors.push('error.unknown_seniority');
  if (!form.offers.every((offer) => OFFERS.includes(offer))) errors.push('error.unknown_offer');
  if (!form.contact_prefs.every((method) => CONTACT_METHODS.includes(method))) errors.push('error.unknown_contact');
  if (form.bio.length > BIO_MAX) errors.push('error.bio_too_long');
  if (form.seeking.length > SEEKING_MAX) errors.push('error.seeking_too_long');

  const phone = normalizePhone(form.phone);
  const linkedin = normalizeLinkedin(form.linkedin_url);
  if (phone.invalid) errors.push('error.invalid_phone');
  if (linkedin.invalid) errors.push('error.invalid_linkedin');
  if (errors.length > 0) return { errors };

  return {
    profile: {
      full_name: form.full_name,
      phone: phone.value,
      linkedin_url: linkedin.value,
      course: emptyToNull(normalizeCourse(form.course)),
      company: emptyToNull(form.company),
      job_title: emptyToNull(form.job_title),
      field: emptyToNull(form.field),
      seniority: emptyToNull(form.seniority),
      location: emptyToNull(form.location),
      education: emptyToNull(form.education),
      bio: emptyToNull(form.bio),
      seeking: emptyToNull(form.seeking),
      skills: parseSkills(form.skills),
      offers: form.offers,
      contact_prefs: form.contact_prefs,
      looking_for_job: form.looking_for_job,
    },
  };
}

function emptyToNull(value) {
  return value === '' ? null : value;
}

export function daysSince(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_MS);
}

// Imported from the old sheet and never saved or confirmed by the member.
export function isUnconfirmed(member) {
  return member.updated_at === null;
}

export function isStale(member) {
  return !isUnconfirmed(member) && daysSince(member.updated_at) > STALE_AFTER_DAYS;
}

export function companyKey(company) {
  return company.trim().toLowerCase().replace(/[\s.\-_]+/g, '');
}
