// In-memory stand-in for Supabase so the app can be tried without any setup.
// Mirrors the access rules in supabase/schema.sql closely enough for a demo. Data resets on reload.
// All people and companies below are fictional.
import { JOB_DEFAULT_DAYS } from './constants.js';

export const DEMO_LOGIN_CODE = '123456';
export const DEMO_ADMIN_EMAIL = 'demo@example.com';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function person(id, fields) {
  return {
    id: `demo-${id}`,
    course: null, phone: null, linkedin_url: null, company: null, job_title: null, field: null, seniority: null,
    location: null, education: null, bio: null, seeking: null, skills: [], offers: [], contact_prefs: [],
    looking_for_job: false,
    status: 'approved', is_admin: false, created_at: daysAgo(400),
    ...fields,
  };
}

function seedMembers() {
  return [
    person(1, { course: '98', education: 'B.Sc. Industrial Engineering, Technion', contact_prefs: ['whatsapp', 'email'], email: DEMO_ADMIN_EMAIL, full_name: 'דנה לוי', phone: '972500000001', company: 'Nimbus Labs', job_title: 'Engineering Manager', field: 'management', seniority: 'manager', location: 'תל אביב', skills: ['Leadership', 'Go', 'AWS'], offers: ['referrals', 'mentoring', 'mock_interview'], is_admin: true, linkedin_url: 'https://www.linkedin.com/in/example-dana', updated_at: daysAgo(3) }),
    person(2, { course: '115', contact_prefs: ['whatsapp'], email: 'yossi@example.com', full_name: 'יוסי כהן', phone: '972500000002', company: 'Nimbus Labs', job_title: 'Senior Backend Engineer', field: 'backend', seniority: 'senior', location: 'רמת גן', skills: ['Python', 'PostgreSQL', 'Kafka'], offers: ['referrals', 'questions'], updated_at: daysAgo(20) }),
    person(3, { course: '115', education: 'B.Sc. Computer Science', email: 'noa@example.com', full_name: 'Noa Friedman', phone: '972500000003', company: 'Cyberion', job_title: 'Security Researcher', field: 'security', seniority: 'mid', location: 'Beer Sheva', skills: ['Reverse engineering', 'C', 'Malware analysis'], offers: ['questions', 'cv_review'], linkedin_url: 'https://www.linkedin.com/in/example-noa', updated_at: daysAgo(45) }),
    person(4, { course: '104', seeking: 'Networking with people in medical AI', email: 'amir@example.com', full_name: 'אמיר חדד', phone: '972500000004', company: 'DataWave', job_title: 'Data Scientist', field: 'data', seniority: 'senior', location: 'חיפה', skills: ['ML', 'PyTorch', 'SQL'], offers: ['mentoring', 'questions'], updated_at: daysAgo(90) }),
    person(5, { course: 'נג', contact_prefs: ['email', 'linkedin'], email: 'shira@example.com', full_name: 'שירה אברהם', phone: '972500000005', company: 'Orbit Payments', job_title: 'Product Manager', field: 'product', seniority: 'lead', location: 'הרצליה', skills: ['Fintech', 'B2B SaaS', 'Analytics'], offers: ['referrals', 'cv_review', 'mock_interview'], linkedin_url: 'https://www.linkedin.com/in/example-shira', updated_at: daysAgo(12) }),
    person(6, { course: '121', seeking: 'Junior frontend / full stack role in Tel Aviv or Jerusalem', contact_prefs: ['whatsapp', 'phone'], email: 'daniel@example.com', full_name: 'Daniel Mizrahi', phone: '972500000006', company: null, job_title: 'Frontend Developer', field: 'frontend', seniority: 'junior', location: 'Jerusalem', skills: ['React', 'TypeScript', 'CSS'], looking_for_job: true, bio: 'Bootcamp graduate, 1 year experience, looking for my next frontend role.', updated_at: daysAgo(2) }),
    person(7, { course: '115', email: 'maya@example.com', full_name: 'מאיה רוזן', phone: '972500000007', company: 'Kinneret AI', job_title: 'ML Engineer', field: 'data', seniority: 'mid', location: 'תל אביב', skills: ['LLMs', 'Python', 'Kubernetes'], offers: ['referrals'], updated_at: daysAgo(30) }),
    person(8, { course: '109', email: 'eitan@example.com', full_name: 'איתן שטרן', phone: '972500000008', company: 'BlueTide', job_title: 'DevOps Engineer', field: 'devops', seniority: 'senior', location: 'פתח תקווה', skills: ['Terraform', 'AWS', 'CI/CD'], offers: ['questions', 'mock_interview'], updated_at: daysAgo(500) }),
    person(9, { course: '118', seeking: 'QA automation or SDET position', email: 'lior@example.com', full_name: 'ליאור בן דוד', phone: '972500000009', company: 'Orbit Payments', job_title: 'QA Automation Engineer', field: 'qa', seniority: 'mid', location: 'ראשון לציון', skills: ['Playwright', 'Java', 'API testing'], looking_for_job: true, updated_at: daysAgo(7) }),
    person(10, { course: 'לט', email: 'tamar@example.com', full_name: 'Tamar Golan', phone: '972500000010', company: 'Pixelforge', job_title: 'UX Designer', field: 'design', seniority: 'senior', location: 'Tel Aviv', skills: ['Figma', 'Design systems', 'User research'], offers: ['cv_review', 'mentoring'], updated_at: daysAgo(60) }),
    person(11, { course: '111', updated_at: null, email: 'ron@example.com', full_name: 'רון אלמוג', phone: '972500000011', company: 'Cyberion', job_title: 'Full Stack Developer', field: 'fullstack', seniority: 'mid', location: 'נתניה', skills: ['Node.js', 'React', 'MongoDB'], offers: ['referrals', 'questions'] }),
    person(12, { course: '102', education: 'M.Sc. Electrical Engineering', email: 'gal@example.com', full_name: 'גל ברק', phone: '972500000012', company: 'Siliconia', job_title: 'Chip Design Engineer', field: 'hardware', seniority: 'senior', location: 'יקנעם', skills: ['Verilog', 'ASIC', 'Verification'], offers: ['questions'], updated_at: daysAgo(420) }),
    person(13, { course: '98', email: 'yael@example.com', full_name: 'יעל מור', phone: '972500000013', company: 'Nimbus Labs', job_title: 'Technical Recruiter', field: 'hr', seniority: 'senior', location: 'תל אביב', skills: ['Tech hiring', 'Sourcing'], offers: ['cv_review', 'mock_interview', 'referrals'], updated_at: daysAgo(5) }),
    person(14, { course: '121', seeking: 'Mobile developer role', updated_at: null, email: 'omer@example.com', full_name: 'Omer Katz', phone: '972500000014', company: 'DataWave', job_title: 'Mobile Developer', field: 'mobile', seniority: 'mid', location: 'Haifa', skills: ['Kotlin', 'Swift', 'Flutter'], looking_for_job: true }),
    person(15, { email: 'pending1@example.com', full_name: 'אורי חדש', status: 'pending', company: 'StartupX', job_title: 'Student', field: 'backend', seniority: 'student', created_at: daysAgo(1), updated_at: daysAgo(1) }),
    person(16, { email: 'pending2@example.com', full_name: 'Rina New', status: 'pending', company: 'BlueTide', job_title: 'Data Analyst', field: 'data', seniority: 'junior', created_at: daysAgo(2), updated_at: daysAgo(2) }),
  ];
}

function seedJobs() {
  return [
    { id: 'job-1', member_id: 'demo-2', company: 'Nimbus Labs', title: 'Backend Engineer (Python)', url: 'https://example.com/jobs/1', details: 'Hybrid, Tel Aviv. 3+ years.', created_at: daysAgo(4), expires_at: daysAgo(-26) },
    { id: 'job-2', member_id: 'demo-5', company: 'Orbit Payments', title: 'Junior Product Analyst', url: null, details: 'Great first role, SQL required.', created_at: daysAgo(10), expires_at: daysAgo(-20) },
    { id: 'job-3', member_id: 'demo-7', company: 'Kinneret AI', title: 'ML Ops Engineer', url: 'https://example.com/jobs/3', details: null, created_at: daysAgo(1), expires_at: daysAgo(-29) },
  ];
}

function clone(value) {
  return structuredClone(value);
}

function notAllowed(action) {
  throw new Error(`${action}: not allowed`);
}

export function createDemoBackend() {
  const members = seedMembers();
  const jobs = seedJobs();
  let sessionEmail = null;
  let pendingLoginEmail = null;

  const me = () => members.find((member) => member.email === sessionEmail);
  const isApproved = () => me() !== undefined && me().status === 'approved';
  const isAdmin = () => isApproved() && me().is_admin;
  const findMember = (id) => {
    const member = members.find((candidate) => candidate.id === id);
    if (member === undefined) throw new Error(`member ${id} not found`);
    return member;
  };
  const requireOwnerOrAdmin = (member, action) => {
    if (member.email !== sessionEmail && !isAdmin()) notAllowed(action);
  };

  return {
    async currentEmail() {
      return sessionEmail;
    },
    async sendLoginCode(email) {
      pendingLoginEmail = email;
    },
    async verifyLoginCode(email, code) {
      if (email !== pendingLoginEmail || code !== DEMO_LOGIN_CODE) throw new Error('Token has expired or is invalid');
      sessionEmail = email;
    },
    async signOut() {
      sessionEmail = null;
    },

    async getMyProfile(email) {
      const member = members.find((candidate) => candidate.email === email);
      return member === undefined ? null : clone(member);
    },
    async createMyProfile(email, profile) {
      if (email !== sessionEmail || me() !== undefined) notAllowed('create profile');
      const member = person(`new-${members.length + 1}`, { ...profile, email, status: 'pending', created_at: daysAgo(0), updated_at: daysAgo(0) });
      members.push(member);
      return clone(member);
    },
    async updateMyProfile(id, profile) {
      const member = findMember(id);
      requireOwnerOrAdmin(member, 'update profile');
      Object.assign(member, profile, member.email === sessionEmail ? { updated_at: daysAgo(0) } : {});
      return clone(member);
    },
    async confirmProfile(id) {
      return this.updateMyProfile(id, {});
    },
    async deleteMyProfile(id) {
      const member = findMember(id);
      requireOwnerOrAdmin(member, 'delete profile');
      members.splice(members.indexOf(member), 1);
    },
    async listMembers() {
      return isApproved() ? clone(members.filter((member) => member.status === 'approved')) : [];
    },

    async listJobs() {
      if (!isApproved()) return [];
      const now = new Date().toISOString();
      return clone(jobs.filter((job) => job.expires_at > now).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    },
    async postJob(job) {
      if (!isApproved() || job.member_id !== me().id) notAllowed('post job');
      const created = { id: `job-${jobs.length + 1}`, url: null, details: null, created_at: daysAgo(0), expires_at: daysAgo(-JOB_DEFAULT_DAYS), ...job };
      jobs.push(created);
      return clone(created);
    },
    async deleteJob(id) {
      const job = jobs.find((candidate) => candidate.id === id);
      if (job === undefined) throw new Error(`job ${id} not found`);
      if (job.member_id !== me().id && !isAdmin()) notAllowed('delete job');
      jobs.splice(jobs.indexOf(job), 1);
    },

    async listAllMembers() {
      if (!isAdmin()) notAllowed('list all members');
      return clone(members);
    },
    async setMemberStatus(id, status) {
      if (!isAdmin()) notAllowed('set status');
      const member = findMember(id);
      member.status = status;
      return clone(member);
    },
  };
}
