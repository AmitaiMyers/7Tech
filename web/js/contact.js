// Ways to reach a member: ready-made WhatsApp messages, email, saving as a phone contact.
import { GROUP_NAME } from './config.js';
import { tPlain } from './i18n.js';

const OPTIONAL_MESSAGE_KINDS = ['referrals', 'cv_review', 'mock_interview', 'mentoring'];

export function whatsappLink(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function firstName(fullName) {
  return fullName.trim().split(/\s+/)[0];
}

// Everyone can be greeted or asked a question; other asks appear only if the member offered them.
export function messageKinds(member) {
  return ['hello', 'questions', ...OPTIONAL_MESSAGE_KINDS.filter((kind) => member.offers.includes(kind))];
}

export function messageText(kind, member, me) {
  return tPlain(`wa.${kind}`, {
    name: firstName(member.full_name),
    me: me.full_name,
    group: GROUP_NAME,
    company: member.company ?? tPlain('wa.your_company'),
  });
}

export function jobReferralText(job, poster, me) {
  return tPlain('wa.job_referral', {
    name: firstName(poster.full_name),
    me: me.full_name,
    group: GROUP_NAME,
    title: job.title,
    company: job.company,
  });
}

export function nudgeText(member, me) {
  return tPlain('wa.nudge', { name: firstName(member.full_name), me: me.full_name, group: GROUP_NAME, url: appUrl() });
}

export function appUrl() {
  return `${location.origin}${location.pathname}`;
}

export function profileUrl(member) {
  return `${appUrl()}#/m/${member.id}`;
}

function escapeVcard(value) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function vcard(member) {
  const parts = member.full_name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(member.full_name)}`,
    `N:${escapeVcard(last)};${escapeVcard(first)};;;`,
    member.company && `ORG:${escapeVcard(member.company)}`,
    member.job_title && `TITLE:${escapeVcard(member.job_title)}`,
    member.phone && `TEL;TYPE=CELL:+${member.phone}`,
    `EMAIL:${escapeVcard(member.email)}`,
    member.linkedin_url && `URL:${escapeVcard(member.linkedin_url)}`,
    `NOTE:${escapeVcard(GROUP_NAME)}`,
    'END:VCARD',
  ];
  return lines.filter(Boolean).join('\r\n') + '\r\n';
}
