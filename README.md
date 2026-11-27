# 7Tech

The 7Tech community directory: a free, installable web app (PWA) that replaces the Google Sheet + Google Form.

- **Find**: instant search by name, course, company, role, field or technology (Hebrew or English). Filters for
  "⚓ my course", "looking for work", "gives referrals", "CV feedback", "mock interviews", "mentoring", course,
  field and seniority.
- **Connect**: one tap opens WhatsApp with a ready-written message ("ask for a referral", "ask a question",
  "ask for CV feedback"…), plus LinkedIn, email, call, "save to contacts" (vCard) and "share profile".
- **Update**: every member logs in with an email code and edits their own card. Profiles show "updated N
  months ago", and an "✓ My details are up to date" button keeps them fresh.
- **Companies**: "who works at X", with how many members there can refer you and how many open roles exist.
- **Jobs board**: members post roles they can refer to; others tap "Ask for a referral". Posts expire after 30 days.
  A "🔎 LinkedIn jobs at companies where members work" button opens the group's saved LinkedIn filter
  (`LINKEDIN_COMPANIES_JOBS_URL` in `web/js/config.js`). Find a role there, then look up who works at that
  company here and ask them for a referral. Admins get a "copy company list" button to keep the filter current.
- **Admin**: approve join requests, remove members, see stale profiles with a one-tap WhatsApp reminder, export CSV.
- Hebrew (RTL) by default with an English switch, dark mode, works offline after the first visit, installs to the home screen.

**Cost: $0.** GitHub Pages hosts the app; Supabase's free tier holds the data and sends login codes.

Try it without any setup: run `npm run serve` (or `python3 -m http.server 8000 --directory web`), open
http://localhost:8000 and log in as `demo@example.com` with code `123456`. While `web/js/config.js` has no
Supabase URL, the app runs in **demo mode** on fictional data.

## How it works

```
Phone / laptop ──► GitHub Pages (static files in web/) ──► Supabase (Postgres + email login)
```

- `web/`: the app. Plain HTML/CSS/JavaScript modules, no build step.
- `supabase/schema.sql`: tables plus the access rules (Row Level Security). This is the security boundary:
  - only **approved members** can see the directory and the jobs board;
  - anyone can log in, but a new email only gets a **join request** that an admin approves;
  - members can edit only **their own** card; only admins change status or admin rights.
- `scripts/import_sheet.py`: one-time migration from the Google Sheet export.

## Go-live checklist (about 30 minutes)

### 1. Create the Supabase project
1. Sign up at supabase.com (free) → **New project**. Pick region *Frankfurt (eu-central-1)*, the closest to Israel.
2. **SQL Editor** → New query → paste all of `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: copy the *Project URL* and the *anon public* key into `web/js/config.js`.
   The anon key is safe to publish; the access rules protect the data.

### 2. Email login
1. **Authentication → Sign In / Providers → Email**: enabled, "Confirm email" on.
2. **Authentication → Emails → Templates → Magic Link**: make sure the body shows the code too, e.g.
   `<h2>קוד הכניסה שלך: {{ .Token }}</h2><p>או <a href="{{ .ConfirmationURL }}">לחצו כאן להתחבר</a></p>`.
   The code matters on iPhone: an app installed on the home screen can't receive a magic link, so people type the code instead.
3. **Authentication → URL Configuration**: set *Site URL* and add a *Redirect URL* for your Pages address
   (e.g. `https://<github-user>.github.io/7Tech/`).
4. **Important: custom SMTP.** Supabase's built-in email sender only allows a few emails per hour and is meant
   for testing. Connect a free SMTP provider under **Authentication → Emails → SMTP Settings**:
   [Resend](https://resend.com) (3,000 emails/month free) or [Brevo](https://www.brevo.com) (300/day free).
   Both need a domain you control to send from. Without one, keep the built-in sender for a small pilot.

### 3. Import the existing sheet
The importer already matches the sheet's columns (Full name, Course, Current role, Company, Few Words About
Myself, Seeking for, Email Address, Phone, Linkedin, Preferred Communication Method, Education).

1. Google Sheet → **File → Download → CSV**. Do **not** commit this file: it holds members' personal details
   (`.gitignore` already excludes `members*.csv` and `import.sql`).
2. `python3 scripts/import_sheet.py members.csv > import.sql`
   - It cleans up as it goes: Hebrew-numeral courses become numbers (`נג` → `53`, `פ"ז` → `87`; text like
     `סימולטורית` or `132-ח` stays as written, and the app applies the same rule when members type a course),
     phones become international (`054-…` → `97254…`), LinkedIn links lose tracking
     parameters and Google-redirect wrappers, `-` counts as empty, and "Whatsapp or Email" style answers become
     contact preferences.
   - Anything it can't read stops the import with a full list: a missing email, an unreadable phone, a LinkedIn
     cell that holds text like "(29) Name | LinkedIn" instead of a link (Google's CSV export keeps only a
     hyperlink's text). Fix those cells, or run with `--lenient` to import anyway: the bad value is left empty,
     rows without name/email are skipped, and everything is listed.
   - If the headers change, edit `COLUMN_MAP` at the top of the script; on a mismatch it prints the real headers.
3. Paste `import.sql` into the Supabase SQL Editor → Run.
   - Imported profiles show "from the old list, not confirmed yet" until the member logs in and confirms or saves.
     The admin tab lists them, with a WhatsApp reminder button, so you can drive sign-ups at launch.
   - Re-running is safe: it never overwrites a profile its owner already confirmed in the app, and never changes
     status or admin rights.
4. Make yourself (and co-admins) admin:
   `update public.members set is_admin = true where email = 'you@example.com';`

### 4. Publish on GitHub Pages
1. GitHub repo → **Settings → Pages → Source: GitHub Actions**.
2. Merge to `main`. The workflow runs the tests, then publishes `web/`.
   The app is at `https://<github-user>.github.io/7Tech/`.
3. Optional: a custom domain (about $10/year) in the same Pages settings, e.g. `directory.7tech.co.il`.

### 5. Launch in the WhatsApp group
- Pin the app link in the group description, replacing the sheet and form links.
- Turn off "Accepting responses" on the Google Form, and restrict the old sheet's sharing, so there is one source of truth.
- Suggested announcement:

  > 🚀 **האלפון של 7Tech עבר לאפליקציה!**
  > 🔎 מחפשים מישהו בחברה מסוימת? מי נותן הפניות? מי עוזר בקורות חיים?
  > 💬 הודעת וואטסאפ מוכנה בלחיצה אחת
  > ✏️ מעדכנים את הפרטים שלכם לבד, בכל רגע
  > 👉 נכנסים עם המייל שמילאתם בטופס: <link>
  > 📲 מומלץ: ״הוספה למסך הבית״ ותקבלו אפליקציה

### Day-to-day admin
- **Join requests** appear under the 🛠️ Admin tab. Approve people you recognize from the group.
- **A member changed email**: Supabase → Table Editor → `members` → edit their `email` cell. Their next login
  with the new address finds the profile.
- **Add another admin**: `update public.members set is_admin = true where email = '…';`

### Free-tier notes
- Supabase pauses a free project after **7 days with no activity**. An active group keeps it awake; if it
  does pause, one click in the dashboard restores it, and no data is lost.
- Free limits (500 MB database, 50,000 monthly users) are far above what a community directory needs.

## Development

```bash
npm install                       # only for the Playwright test dependency
npm run serve                     # http://localhost:8000 (demo mode while config.js is empty)
npm test                          # all checks below
node scripts/check_i18n.mjs       # Hebrew/English strings complete
node scripts/check_normalizers.mjs # app and importer clean phones/courses identically
scripts/test_db.sh                # access rules + sheet import, on a throwaway local Postgres
node scripts/smoke_test.cjs [dir] # drives every screen in a phone-sized browser (optional screenshots)
```

Lists of fields, seniority levels and "how I can help" options are in `web/js/constants.js`. Keep them in
sync with the `check` constraints in `supabase/schema.sql` and the maps in `scripts/import_sheet.py`.

To change an already-created database, run only the `alter table …` statement you need in the SQL Editor.
`schema.sql` is for a fresh project.
