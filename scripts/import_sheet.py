#!/usr/bin/env python3
"""Convert the old Google Sheet (exported as CSV) into SQL that loads the members table.

Usage:
    1. In the Google Sheet: File → Download → Comma-separated values (.csv)
    2. python3 scripts/import_sheet.py members.csv > import.sql
       (if the headers changed, edit COLUMN_MAP below; the script prints the real headers on mismatch)
    3. Supabase → SQL Editor → paste import.sql → Run.

By default the script stops and lists every problem (missing email, unreadable phone, a LinkedIn cell that holds
text instead of a link…) so the sheet can be fixed first. With --lenient it imports anyway: a bad optional value
is left empty, a row without name or email is skipped, and every such decision is listed on stderr.

Imported profiles are marked "not confirmed yet" (updated_at = NULL) until the member logs in and saves or
confirms. Re-running the import is safe: it never overwrites a profile its owner has already confirmed, and it
never touches status or the admin flag.
"""
import argparse
import csv
import re
import sys
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlsplit

# ──────────────── Sheet header row → members column (None = the sheet has no such column) ────────────────
COLUMN_MAP = {
    "full_name": "Full name",
    "course": "Course",
    "job_title": "Current role",
    "company": "Company",
    "bio": "Few Words About Myself",
    "seeking": "Seeking for",
    "email": "Email Address",
    "phone": "Phone",
    "linkedin_url": "Linkedin",
    "contact_prefs": "Preferred Communication Method",
    "education": "Education",
    "timestamp": None,
    "field": None,
    "seniority": None,
    "location": None,
    "skills": None,
    "offers": None,
    "looking_for_job": None,
}
REQUIRED = ("email", "full_name")

# Only used if COLUMN_MAP["timestamp"] is set. Google Forms uses the owner's locale, e.g. 27/11/2025 10:30:15.
TIMESTAMP_FORMATS = ["%d/%m/%Y %H:%M:%S", "%m/%d/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"]

# Cell values that mean "nothing here".
EMPTY_MARKERS = {"", "-", "--", "—", "n/a", "na", "none", "אין"}

# Only used if the field / seniority / offers columns are mapped. Sheet answer (lower-cased) → app key.
FIELD_VALUES = {
    "backend": "backend", "frontend": "frontend", "fullstack": "fullstack", "full stack": "fullstack",
    "mobile": "mobile", "devops": "devops", "data": "data", "qa": "qa", "security": "security", "cyber": "security",
    "hardware": "hardware", "product": "product", "design": "design", "it": "it", "sales": "sales",
    "marketing": "marketing", "hr": "hr", "finance": "finance", "management": "management", "other": "other",
}
SENIORITY_VALUES = {
    "student": "student", "junior": "junior", "mid": "mid", "senior": "senior", "lead": "lead",
    "manager": "manager", "director": "director", "vp": "executive", "cto": "executive", "ceo": "executive",
}
OFFER_VALUES = {
    "referrals": "referrals", "questions": "questions", "cv": "cv_review",
    "mock interview": "mock_interview", "mentoring": "mentoring",
}
YES_VALUES = {"כן", "yes", "true", "1"}

# Free-text "Preferred Communication Method" → contact keys. Matched as substrings, case-insensitive.
CONTACT_KEYWORDS = {
    "whatsapp": ("whats", "what's", "whatapp", "וואטסאפ", "ווטסאפ", "וואצאפ"),
    "email": ("mail", "מייל"),
    "phone": ("phone", "call", "טלפון", "שיחה"),
    "linkedin": ("linkedin", "לינקדאין"),
}
# ─────────────────────────────────────────────────────────────────────────────────────────────────────────

LIMITS = {"bio": 2000, "seeking": 500}


class RowReport:
    """Collects what went wrong in one row. `fatal` problems skip the row; `value` problems drop one value."""

    def __init__(self, line):
        self.line = line
        self.fatal = []
        self.value = []

    def messages(self):
        return [f"line {self.line}: {m}" for m in self.fatal + self.value]


def is_empty(raw):
    return raw.strip().lower() in EMPTY_MARKERS


# Hebrew numerals (gematria). Final letters count like their regular forms.
HEBREW_LETTER_VALUES = dict(zip("אבגדהוזחטיכךלמםנןסעפףצץקרשת",
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 20, 30, 40, 40, 50, 50, 60, 70, 80, 80, 90, 90,
                                 100, 200, 300, 400]))


def normalize_course(raw):
    """Same rules as normalizeCourse in web/js/profile.js: a Hebrew numeral (נג, פ"ז, ס׳) becomes its number;
    anything else (115, 132-ח, סימולטורית) is kept as written. A numeral has 1–4 letters in non-increasing value."""
    text = raw.strip()
    letters = re.sub("[\"'׳״]", "", text)
    if re.fullmatch(r"[א-ת]{1,4}", letters):
        values = [HEBREW_LETTER_VALUES[letter] for letter in letters]
        if all(a >= b for a, b in zip(values, values[1:])):
            return str(sum(values))
    return text


def normalize_phone(raw):
    """Same rules as normalizePhone in web/js/profile.js. Returns (value, ok)."""
    digits = re.sub(r"[^\d+]", "", raw)
    if digits == "":
        return None, True
    international = re.sub(r"^00", "", digits.lstrip("+"))
    if international.startswith("0"):
        international = "972" + international[1:]
    return (international, True) if re.fullmatch(r"\d{8,15}", international) else (None, False)


def clean_linkedin(raw):
    """Unwraps Google redirect links and drops tracking parameters, then applies the app's LinkedIn rule."""
    url = raw.strip()
    parts = urlsplit(url if re.match(r"^https?://", url, re.I) else f"https://{url}")
    if parts.netloc.endswith("google.com") and parts.path == "/url":
        query = parse_qs(parts.query)
        if "url" not in query:
            return None, False
        parts = urlsplit(query["url"][0])
    if re.fullmatch(r"([a-z]{2,3}\.)?linkedin\.com", parts.netloc, re.I) is None or parts.path in ("", "/"):
        return None, False
    return f"https://{parts.netloc.lower()}{parts.path}", True


def parse_contact_prefs(raw):
    text = f" {raw.lower()} "
    return sorted(key for key, words in CONTACT_KEYWORDS.items() if any(word in text for word in words))


def parse_timestamp(raw):
    for fmt in TIMESTAMP_FORMATS:
        if re.fullmatch(_format_regex(fmt), raw):
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
    return None


def _format_regex(fmt):
    pattern = re.escape(fmt)
    for directive, regex in (("%d", r"\d{1,2}"), ("%m", r"\d{1,2}"), ("%Y", r"\d{4}"),
                             ("%H", r"\d{1,2}"), ("%M", r"\d{2}"), ("%S", r"\d{2}")):
        pattern = pattern.replace(re.escape(directive), regex)
    return pattern


def read_cell(row, column):
    header = COLUMN_MAP[column]
    if header is None:
        return ""
    value = row[header].strip()
    return "" if is_empty(value) else value


def map_choice(raw, mapping, label, report):
    if raw == "":
        return None
    key = raw.lower()
    if key not in mapping:
        report.value.append(f'unknown {label} "{raw}" (add it to {label.upper()}_VALUES)')
        return None
    return mapping[key]


def limited_text(row, column, report):
    value = read_cell(row, column)
    if len(value) > LIMITS[column]:
        report.value.append(f"{column} is longer than {LIMITS[column]} characters")
        return None
    return value or None


def convert_row(row, line):
    """Returns (member or None, report)."""
    report = RowReport(line)
    email = read_cell(row, "email").lower()
    full_name = read_cell(row, "full_name")
    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) is None:
        report.fatal.append(f'missing or invalid email "{email}"')
    if full_name == "":
        report.fatal.append("missing full name")

    phone_raw = read_cell(row, "phone")
    phone, phone_ok = normalize_phone(phone_raw)
    if not phone_ok:
        report.value.append(f'unreadable phone "{phone_raw}"')

    linkedin_raw = read_cell(row, "linkedin_url")
    linkedin, linkedin_ok = clean_linkedin(linkedin_raw) if linkedin_raw else (None, True)
    if not linkedin_ok:
        report.value.append(f'LinkedIn cell is not a profile link: "{linkedin_raw}"')

    updated_at = None
    timestamp_raw = read_cell(row, "timestamp")
    if timestamp_raw:
        updated_at = parse_timestamp(timestamp_raw)
        if updated_at is None:
            report.value.append(f'unrecognized timestamp "{timestamp_raw}" (adjust TIMESTAMP_FORMATS)')

    offers = [map_choice(part.strip(), OFFER_VALUES, "offer", report)
              for part in read_cell(row, "offers").split(",") if part.strip()]

    member = {
        "email": email,
        "full_name": full_name,
        "course": normalize_course(read_cell(row, "course")) or None,
        "phone": phone,
        "linkedin_url": linkedin,
        "company": read_cell(row, "company") or None,
        "job_title": read_cell(row, "job_title") or None,
        "field": map_choice(read_cell(row, "field"), FIELD_VALUES, "field", report),
        "seniority": map_choice(read_cell(row, "seniority"), SENIORITY_VALUES, "seniority", report),
        "location": read_cell(row, "location") or None,
        "education": read_cell(row, "education") or None,
        "bio": limited_text(row, "bio", report),
        "seeking": limited_text(row, "seeking", report),
        "skills": sorted({s.strip() for s in read_cell(row, "skills").split(",") if s.strip()}),
        "offers": sorted({o for o in offers if o is not None}),
        "contact_prefs": parse_contact_prefs(read_cell(row, "contact_prefs")),
        "looking_for_job": read_cell(row, "looking_for_job").lower() in YES_VALUES,
        "updated_at": updated_at,
    }
    return (None if report.fatal else member), report


def check_headers(headers):
    missing = [f'{column}: "{header}"' for column, header in COLUMN_MAP.items()
               if header is not None and header not in headers]
    missing += [f"{column}: mapped to None but required" for column in REQUIRED if COLUMN_MAP[column] is None]
    if missing:
        sys.exit("These COLUMN_MAP headers are not in the CSV:\n  " + "\n  ".join(missing)
                 + "\n\nThe CSV headers are:\n  " + "\n  ".join(h for h in headers if h))


def pick_duplicate(existing, candidate, line, messages):
    """Same email twice: the newer timestamp wins; without timestamps the later row wins."""
    messages.append(f"line {line}: duplicate email {candidate['email']}, keeping the "
                    + ("newer" if existing["updated_at"] and candidate["updated_at"] else "later") + " row")
    if existing["updated_at"] and candidate["updated_at"]:
        return candidate if candidate["updated_at"] >= existing["updated_at"] else existing
    return candidate


def sql_text(value):
    return "null" if value is None else "'" + value.replace("'", "''") + "'"


def sql_array(values):
    return "array[" + ", ".join(sql_text(v) for v in values) + "]::text[]"


COLUMNS = ["email", "full_name", "course", "phone", "linkedin_url", "company", "job_title", "field", "seniority",
           "location", "education", "bio", "seeking", "skills", "offers", "contact_prefs", "looking_for_job",
           "updated_at"]


def sql_value(member, column):
    value = member[column]
    if isinstance(value, list):
        return sql_array(value)
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, datetime):
        return sql_text(value.isoformat())
    return sql_text(value)


def to_sql(members):
    updatable = [c for c in COLUMNS if c != "email"]
    lines = ["-- Generated by scripts/import_sheet.py. Run in the Supabase SQL Editor.", "begin;"]
    for member in members:
        values = ", ".join(sql_value(member, c) for c in COLUMNS)
        lines.append(f"insert into public.members ({', '.join(COLUMNS)}, status) values ({values}, 'approved')")
        lines.append(f"  on conflict (email) do update set {', '.join(f'{c} = excluded.{c}' for c in updatable)}")
        # Never overwrite what a member already confirmed in the app.
        lines.append("  where public.members.updated_at is null"
                     " or public.members.updated_at < excluded.updated_at;")
    lines.append("commit;")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_path")
    parser.add_argument("--lenient", action="store_true",
                        help="import anyway: drop bad values, skip rows without name/email, list it all on stderr")
    args = parser.parse_args()

    messages = []
    has_problems = False
    members_by_email = {}
    with open(args.csv_path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle, restval="")
        check_headers(reader.fieldnames)
        for line, row in enumerate(reader, start=2):
            if all(is_empty(value or "") for value in row.values()):
                continue
            member, report = convert_row(row, line)
            messages += report.messages()
            has_problems = has_problems or bool(report.fatal or report.value)
            if member is None:
                continue
            email = member["email"]
            if email in members_by_email:
                has_problems = True
                members_by_email[email] = pick_duplicate(members_by_email[email], member, line, messages)
            else:
                members_by_email[email] = member

    if has_problems and not args.lenient:
        sys.exit(f"Found {len(messages)} problem(s); nothing was generated. Fix the sheet, or re-run with --lenient.\n  "
                 + "\n  ".join(messages))
    if messages:
        print("Imported with these adjustments:\n  " + "\n  ".join(messages), file=sys.stderr)

    sys.stdout.write(to_sql(sorted(members_by_email.values(), key=lambda m: m["email"])))
    print(f"{len(members_by_email)} members ready to import.", file=sys.stderr)


if __name__ == "__main__":
    main()
