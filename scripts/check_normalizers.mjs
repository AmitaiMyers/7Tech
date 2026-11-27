// The importer (Python) and the app (JavaScript) must clean phones and courses identically,
// otherwise imported data and data members type in the app would disagree. Usage: node scripts/check_normalizers.mjs
import { execFileSync } from 'node:child_process';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { normalizeCourse, normalizePhone } = await import('../web/js/profile.js');

const COURSES = ['נג', 'פ"ז', 'ס׳', 'כג', 'טו', 'אב', 'סימולטורית', '132-ח', '115', 'קק״צ אפריל 5', ' 96 ', ''];
const PHONES = ['054-817-8711', '+972 54 817 8711', '00972548178711', '050', '', '(052) 555-1234'];

const python = `
import json, sys
sys.path.insert(0, "scripts")
from import_sheet import normalize_course, normalize_phone
data = json.load(sys.stdin)
print(json.dumps({
    "courses": [normalize_course(c) for c in data["courses"]],
    "phones": [normalize_phone(p) for p in data["phones"]],
}))`;
const fromPython = JSON.parse(execFileSync('python3', ['-I', '-c', python], {
  input: JSON.stringify({ courses: COURSES, phones: PHONES }),
  cwd: new URL('..', import.meta.url).pathname,
}).toString());

const problems = [];
COURSES.forEach((course, i) => {
  if (normalizeCourse(course) !== fromPython.courses[i]) problems.push(`course "${course}": js=${normalizeCourse(course)} py=${fromPython.courses[i]}`);
});
PHONES.forEach((phone, i) => {
  const js = normalizePhone(phone);
  const [pyValue, pyOk] = fromPython.phones[i];
  if (Boolean(js.invalid) === pyOk || (pyOk && js.value !== pyValue)) problems.push(`phone "${phone}": js=${JSON.stringify(js)} py=${pyValue},${pyOk}`);
});

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`normalizers OK: ${COURSES.length} courses, ${PHONES.length} phones agree between app and importer`);
