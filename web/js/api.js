// Data access. One interface, two backends: Supabase (real) and an in-memory demo.
// Every call either returns data or throws; the app shows thrown errors as a toast.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';
import { appUrl } from './contact.js';
import { createDemoBackend } from './demo-backend.js';

export const isDemo = SUPABASE_URL === '';

const MEMBER_COLUMNS = 'id,email,full_name,course,phone,linkedin_url,company,job_title,field,seniority,location,'
  + 'education,bio,seeking,skills,offers,contact_prefs,looking_for_job,status,is_admin,updated_at';
const JOB_COLUMNS = 'id,member_id,company,title,url,details,created_at,expires_at';
const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request by default.

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

function expectOneRow(rows, action) {
  if (rows.length !== 1) throw new Error(`${action}: expected 1 row, got ${rows.length} (not allowed?)`);
  return rows[0];
}

async function fetchAllPages(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await buildQuery().range(from, from + PAGE_SIZE - 1));
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function createSupabaseBackend() {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const members = () => client.from('members');
  const jobs = () => client.from('jobs');

  return {
    async currentEmail() {
      const { session } = unwrap(await client.auth.getSession());
      return session === null ? null : session.user.email.toLowerCase();
    },
    async sendLoginCode(email) {
      unwrap(await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: appUrl() } }));
    },
    async verifyLoginCode(email, code) {
      unwrap(await client.auth.verifyOtp({ email, token: code, type: 'email' }));
    },
    async signOut() {
      unwrap(await client.auth.signOut());
    },

    async getMyProfile(email) {
      return unwrap(await members().select(MEMBER_COLUMNS).eq('email', email).maybeSingle());
    },
    async createMyProfile(email, profile) {
      return unwrap(await members().insert({ ...profile, email }).select(MEMBER_COLUMNS).single());
    },
    async updateMyProfile(id, profile) {
      return unwrap(await members().update(profile).eq('id', id).select(MEMBER_COLUMNS).single());
    },
    async confirmProfile(id) {
      // The database trigger stamps updated_at = now() whenever the owner saves.
      return unwrap(await members().update({ updated_at: new Date().toISOString() }).eq('id', id).select(MEMBER_COLUMNS).single());
    },
    async deleteMyProfile(id) {
      expectOneRow(unwrap(await members().delete().eq('id', id).select('id')), 'delete profile');
    },
    async listMembers() {
      return fetchAllPages(() => members().select(MEMBER_COLUMNS).eq('status', 'approved').order('id'));
    },

    async listJobs() {
      return unwrap(await jobs().select(JOB_COLUMNS).order('created_at', { ascending: false }));
    },
    async postJob(job) {
      return unwrap(await jobs().insert(job).select(JOB_COLUMNS).single());
    },
    async deleteJob(id) {
      expectOneRow(unwrap(await jobs().delete().eq('id', id).select('id')), 'delete job');
    },

    async listAllMembers() {
      return fetchAllPages(() => members().select(`${MEMBER_COLUMNS},created_at`).order('id'));
    },
    async setMemberStatus(id, status) {
      return unwrap(await members().update({ status }).eq('id', id).select(MEMBER_COLUMNS).single());
    },
  };
}

export const api = isDemo ? createDemoBackend() : createSupabaseBackend();
