// Fixed option lists. Keys are stored in the database; labels live in i18n.js.
// Keep FIELDS, SENIORITIES and OFFERS in sync with the CHECK constraints in supabase/schema.sql
// and with the value maps in scripts/import_sheet.py.

export const FIELDS = [
  'backend', 'frontend', 'fullstack', 'mobile', 'devops', 'data', 'qa', 'security',
  'hardware', 'product', 'design', 'project', 'it', 'sales', 'marketing', 'hr',
  'finance', 'management', 'other',
];

export const SENIORITIES = ['student', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'];

export const OFFERS = ['referrals', 'questions', 'cv_review', 'mock_interview', 'mentoring'];

export const CONTACT_METHODS = ['whatsapp', 'phone', 'email', 'linkedin'];

// Keep in sync with the length checks in supabase/schema.sql.
export const BIO_MAX = 2000;
export const SEEKING_MAX = 500;

// A profile not saved or confirmed by its owner for this long is shown as "may be outdated".
export const STALE_AFTER_DAYS = 365;

export const JOB_DEFAULT_DAYS = 30;
