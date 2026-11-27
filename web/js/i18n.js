// Hebrew (default, RTL) and English strings. t() throws on a missing key so gaps surface immediately.
// A key with a "_one" variant is used when vars.count === 1.

export const LANGUAGES = ['he', 'en'];
const DEFAULT_LANG = 'he';
const LANG_STORAGE_KEY = 'lang';

const STRINGS = {
  he: {
    'app.name': '7Tech',
    'app.demo': 'דמו',
    'app.offline': 'אופליין',
    'common.role_at': '{title} ב-{company}',
    'common.see_company': '🏢 כל החברים ב-{company}',
    'common.back': 'חזרה',
    'common.back_arrow': '→ חזרה',
    'common.loading': 'טוען…',

    'tabs.label': 'ניווט ראשי',
    'tabs.people': 'אנשים',
    'tabs.companies': 'חברות',
    'tabs.jobs': 'משרות',
    'tabs.me': 'הפרופיל שלי',
    'tabs.admin': 'ניהול',

    'login.title': 'קהילת {group}',
    'login.tagline': 'אלפון הקהילה: מי עובד איפה, מי יכול לעזור, ואיך מתחברים בקליק.',
    'login.benefit_find': '🔎 חיפוש לפי שם, חברה, תפקיד או טכנולוגיה',
    'login.benefit_connect': '💬 הודעת וואטסאפ מוכנה: שאלה, הפניה, עזרה בקו״ח',
    'login.benefit_update': '✏️ עדכון הפרטים שלך בעצמך, בכל רגע',
    'login.email': 'אימייל',
    'login.send_code': 'שלחו לי קוד כניסה',
    'login.code_sent': 'שלחנו קוד כניסה וקישור אל {email}. הקלידו את הקוד כאן (או לחצו על הקישור במייל).',
    'login.code': 'קוד מהמייל',
    'login.verify': 'כניסה',
    'login.change_email': 'אימייל אחר',
    'login.resend': 'שליחה מחדש',
    'login.code_resent': 'קוד חדש נשלח',
    'login.demo_hint': 'מצב דמו עם נתונים מומצאים. התחברו עם {email} (מנהל/ת) או כל אימייל אחר כדי לנסות הצטרפות. הקוד: {code}',

    'directory.search_placeholder': 'חיפוש: שם, חברה, תפקיד, טכנולוגיה…',
    'directory.count': '{count} אנשים',
    'directory.count_one': 'אדם אחד',
    'directory.no_results': 'לא נמצאו אנשים. נסו מילים אחרות או הסירו סינון.',
    'directory.show_more': 'הצג עוד ({count})',
    'directory.looking_only': '🔍 מחפשים עבודה',
    'directory.more_filters': 'תחום ובכירות',
    'directory.clear_filters': 'נקה סינון',
    'directory.company_filter': 'חברה: {company}',
    'directory.any_field': 'כל התחומים',
    'directory.any_seniority': 'כל רמות הבכירות',
    'directory.any_course': 'כל המחזורים',
    'directory.my_course': '⚓ המחזור שלי ({course})',

    'member.looking': 'מחפש/ת עבודה',
    'member.not_found': 'הפרופיל לא נמצא',
    'member.not_found_hint': 'ייתכן שהפרופיל הוסר או שעדיין לא אושר.',
    'member.edit_mine': 'עריכת הפרופיל שלי',
    'member.offers_title': '{name} שמח/ה לעזור ב:',
    'member.skills': 'כישורים וטכנולוגיות',
    'member.connect': 'יצירת קשר',
    'member.no_phone': 'לא הוזן מספר טלפון. אפשר לפנות במייל או בלינקדאין.',
    'member.open_jobs': 'משרות שפרסם/ה',
    'member.course': 'מחזור {course}',
    'member.seeking_title': 'מה אני מחפש/ת',
    'member.prefers': 'מעדיף/ה ליצור קשר ב: {methods}',

    'contact_method.whatsapp': 'וואטסאפ',
    'contact_method.phone': 'טלפון',
    'contact_method.email': 'אימייל',
    'contact_method.linkedin': 'לינקדאין',

    'contact.ask.hello': 'להגיד שלום',
    'contact.ask.questions': 'לשאול שאלה',
    'contact.ask.referrals': 'לבקש הפניה (ולשלוח קו״ח)',
    'contact.ask.cv_review': 'לבקש עזרה בקורות חיים',
    'contact.ask.mock_interview': 'לבקש ראיון הכנה',
    'contact.ask.mentoring': 'לבקש ליווי / מנטורינג',
    'contact.whatsapp_to': 'וואטסאפ אל {name}',
    'contact.email': 'אימייל',
    'contact.call': 'שיחה',
    'contact.save_contact': '📇 שמירה באנשי הקשר',
    'contact.share': '🔗 שיתוף פרופיל',
    'contact.link_copied': 'הקישור הועתק',

    'offer.referrals': 'הפניות לחברה שלי',
    'offer.questions': 'מענה על שאלות',
    'offer.cv_review': 'עזרה בקורות חיים',
    'offer.mock_interview': 'ראיונות הכנה',
    'offer.mentoring': 'מנטורינג',

    'fresh.updated': 'עודכן {when}',
    'fresh.stale': 'עודכן {when}, ייתכן שאינו עדכני',
    'fresh.unconfirmed': 'מהרשימה הישנה, טרם אושר ע״י החבר/ה',

    'wa.hello': 'היי {name}, כאן {me} מקבוצת {group} 👋',
    'wa.questions': 'היי {name}, כאן {me} מקבוצת {group}. ראיתי את הפרופיל שלך ורציתי לשאול שאלה קצרה: ',
    'wa.referrals': 'היי {name}, כאן {me} מקבוצת {group}. אני מחפש/ת משרה ב-{company}, ואשמח מאוד אם תוכל/י להפנות אותי. אשלח קורות חיים, תודה מראש!',
    'wa.cv_review': 'היי {name}, כאן {me} מקבוצת {group}. ראיתי שאת/ה עוזר/ת בקורות חיים. אשמח אם תוכל/י להעיף מבט על שלי 🙏',
    'wa.mock_interview': 'היי {name}, כאן {me} מקבוצת {group}. יש לי ראיון בקרוב. יש לך זמן לראיון הכנה קצר?',
    'wa.mentoring': 'היי {name}, כאן {me} מקבוצת {group}. אשמח להתייעץ איתך על הקריירה שלי. יש לך זמן לשיחה קצרה?',
    'wa.job_referral': 'היי {name}, כאן {me} מקבוצת {group}. ראיתי שפרסמת משרת {title} ב-{company} ואשמח להפניה. אשלח קורות חיים, תודה!',
    'wa.nudge': 'היי {name}, כאן {me} ממנהלי {group} 👋 הפרופיל שלך באלפון לא עודכן הרבה זמן. דקה לעדכן? {url}',
    'wa.your_company': 'החברה שלך',

    'companies.title': 'חברות',
    'companies.search_placeholder': 'חיפוש חברה…',
    'companies.count': '{count} חברות',
    'companies.members': '{count} חברים',
    'companies.members_one': 'חבר/ה אחד/ת',
    'companies.referrers': '{count} מפנים',
    'companies.referrers_one': 'מפנה אחד',
    'companies.jobs': '{count} משרות',
    'companies.jobs_one': 'משרה אחת',
    'companies.looking': '{count} מחפשים',
    'companies.no_results': 'לא נמצאו חברות.',

    'jobs.title': 'משרות מהקהילה',
    'linkedin.jobs_button': '🔎 משרות בלינקדאין בחברות שחברי הקבוצה עובדים בהן',
    'linkedin.jobs_hint': 'נפתח חיפוש שמור בלינקדאין. מצאתם משרה? חפשו את החברה כאן באלפון ובקשו הפניה ממי שעובד שם.',
    'jobs.intro': 'משרות שחברי הקבוצה יכולים להפנות אליהן. משרה יורדת אוטומטית אחרי 30 יום.',
    'jobs.post': '+ פרסום משרה שאני יכול/ה להפנות אליה',
    'jobs.company': 'חברה',
    'jobs.role': 'תפקיד',
    'jobs.url': 'קישור למשרה (לא חובה)',
    'jobs.details': 'פרטים (לא חובה)',
    'jobs.expiry_hint': 'המשרה תוצג 30 יום.',
    'jobs.publish': 'פרסום',
    'jobs.published': 'המשרה פורסמה',
    'jobs.empty': 'אין משרות פתוחות כרגע. יש לך משרה להפנות אליה? פרסמו אותה!',
    'jobs.posted_by': 'פורסם {when} ע״י',
    'jobs.days_left': 'עוד {count} ימים',
    'jobs.days_left_one': 'עוד יום אחד',
    'jobs.ask_referral': 'לבקש הפניה מ{name}',
    'jobs.view_posting': 'למשרה',
    'jobs.delete': 'מחיקה',
    'jobs.delete_confirm': 'למחוק את המשרה?',

    'me.title': 'הפרופיל שלי',
    'me.freshness_hint': 'פרופיל עדכני עוזר לאנשים למצוא אותך. אם הכול עדיין נכון, לחצו כאן:',
    'me.still_accurate': '✓ הפרטים שלי עדכניים',
    'me.confirmed': 'תודה! סימנו את הפרופיל כעדכני',
    'me.save': 'שמירה',
    'me.saved': 'הפרופיל נשמר',
    'me.unconfirmed_hint': 'הפרטים הועברו מהגיליון הישן. בדקו שהם נכונים ולחצו כאן (או ערכו ושמרו למטה):',

    'join.title': 'הצטרפות לאלפון',
    'join.intro': 'עוד לא מצאנו פרופיל עם האימייל הזה. מלאו פרטים ומנהל/ת יאשר/תאשר את ההצטרפות. אם כבר מילאת את הטופס הישן עם אימייל אחר, התחברו עם האימייל ההוא.',
    'join.submit': 'שליחת בקשת הצטרפות',
    'join.sent': 'הבקשה נשלחה! נעדכן כשתאושר.',

    'pending.title': 'הבקשה ממתינה לאישור',
    'pending.body': 'קיבלנו את הבקשה. אחרי שמנהל/ת יאשר/תאשר, האלפון ייפתח. בינתיים אפשר לעדכן את הפרטים.',
    'removed.title': 'הגישה לאלפון סגורה',
    'removed.body': 'הפרופיל שלך הוסר מהאלפון. לשאלות, פנו למנהלי הקבוצה.',

    'form.email_hint': 'מחובר/ת כ-{email}. האימייל משמש לכניסה ומוצג לחברי הקהילה.',
    'form.full_name': 'שם מלא *',
    'form.course': 'קורס / מחזור',
    'form.course_placeholder': 'למשל: 115',
    'form.education': 'השכלה',
    'form.education_placeholder': 'למשל: B.Sc. הנדסת חשמל, טכניון',
    'form.seeking': 'מה אני מחפש/ת כרגע',
    'form.seeking_placeholder': 'למשל: משרת Data Science, נטוורקינג, שותפים לסטארטאפ…',
    'form.contact_prefs': 'איך עדיף ליצור איתי קשר',
    'form.phone': 'טלפון (לוואטסאפ)',
    'form.linkedin': 'קישור ללינקדאין',
    'form.company': 'חברה נוכחית',
    'form.job_title': 'תפקיד',
    'form.field': 'תחום',
    'form.seniority': 'בכירות',
    'form.choose': 'בחירה…',
    'form.location': 'אזור',
    'form.location_placeholder': 'למשל: תל אביב',
    'form.skills': 'כישורים וטכנולוגיות (מופרדים בפסיק)',
    'form.skills_placeholder': 'Python, React, ניהול מוצר',
    'form.bio': 'כמה מילים עליך',
    'form.bio_placeholder': 'במה את/ה עוסק/ת, מה מעניין אותך…',
    'form.offers': 'במה אני שמח/ה לעזור לחברי הקהילה',
    'form.looking': 'אני מחפש/ת עבודה',
    'form.looking_hint': 'יופיע תג ״מחפש/ת עבודה״ ואנשים יוכלו למצוא אותך בסינון',

    'error.name_required': 'חובה למלא שם מלא',
    'error.invalid_phone': 'מספר הטלפון לא תקין (למשל 050-1234567 או +972501234567)',
    'error.invalid_linkedin': 'קישור לינקדאין צריך להיות בצורה linkedin.com/in/…',
    'error.unknown_field': 'תחום לא מוכר',
    'error.unknown_seniority': 'בכירות לא מוכרת',
    'error.unknown_offer': 'אפשרות עזרה לא מוכרת',
    'error.bio_too_long': 'התיאור ארוך מ-2000 תווים',
    'error.seeking_too_long': 'השדה ״מה אני מחפש/ת״ ארוך מ-500 תווים',
    'error.unknown_contact': 'דרך יצירת קשר לא מוכרת',
    'error.bad_code': 'הקוד שגוי או שפג תוקפו. נסו שוב או בקשו קוד חדש.',
    'error.rate_limited': 'יותר מדי ניסיונות. המתינו דקה ונסו שוב.',
    'error.network': 'אין חיבור לאינטרנט. נסו שוב.',

    'settings.title': 'הגדרות',
    'settings.switch_to_he': 'עברית',
    'settings.switch_to_en': 'English',
    'settings.install': '📲 התקנת האפליקציה',
    'settings.ios_install_hint': 'באייפון: בספארי לחצו על כפתור השיתוף ואז ״הוספה למסך הבית״.',
    'settings.sign_out': 'התנתקות',
    'settings.delete_profile': 'מחיקת הפרופיל שלי מהאלפון',
    'settings.delete_confirm': 'למחוק את הפרופיל לצמיתות? חברי הקהילה לא יוכלו למצוא אותך.',

    'admin.title': 'ניהול',
    'admin.stat_members': 'חברים',
    'admin.stat_pending': 'ממתינים',
    'admin.stat_looking': 'מחפשים עבודה',
    'admin.stat_stale': 'לא עודכנו מעל שנה',
    'admin.stat_unconfirmed': 'טרם אישרו פרטים',
    'admin.pending_title': 'בקשות הצטרפות',
    'admin.pending_empty': 'אין בקשות ממתינות.',
    'admin.requested': 'ביקש/ה {when}',
    'admin.approve': 'אישור',
    'admin.reject': 'דחייה',
    'admin.stale_title': 'צריכים עדכון',
    'admin.stale_hint': 'מי שעוד לא אישר/ה את הפרטים מהגיליון הישן, ומי שלא עדכן/ה מעל שנה. שלחו תזכורת בוואטסאפ.',
    'admin.stale_empty': 'כל הפרופילים עדכניים 🎉',
    'admin.nudge': 'תזכורת',
    'admin.manage_title': 'ניהול חברים',
    'admin.manage_placeholder': 'חיפוש לפי שם או אימייל…',
    'admin.status_approved': 'פעיל/ה',
    'admin.status_pending': 'ממתין/ה',
    'admin.status_removed': 'הוסר/ה',
    'admin.remove': 'הסרה',
    'admin.restore': 'החזרה',
    'admin.export_csv': '⬇️ ייצוא כל החברים ל-CSV',
    'admin.companies_title': 'חברות לסינון בלינקדאין',
    'admin.companies_hint': 'סינון המשרות בלינקדאין מתעדכן ידנית. העתיקו את רשימת החברות של חברי הקהילה כדי להוסיף חברות חדשות לסינון.',
    'admin.companies_copy': '📋 העתקת רשימת החברות',
    'admin.companies_copied': 'רשימת החברות הועתקה',

    'field.backend': 'פיתוח Backend',
    'field.frontend': 'פיתוח Frontend',
    'field.fullstack': 'פיתוח Full Stack',
    'field.mobile': 'פיתוח מובייל',
    'field.devops': 'DevOps / ענן',
    'field.data': 'דאטה / AI / ML',
    'field.qa': 'QA / בדיקות',
    'field.security': 'סייבר / אבטחת מידע',
    'field.hardware': 'חומרה / Embedded',
    'field.product': 'ניהול מוצר',
    'field.design': 'עיצוב / UX',
    'field.project': 'ניהול פרויקטים',
    'field.it': 'IT / מערכות מידע',
    'field.sales': 'מכירות / פיתוח עסקי',
    'field.marketing': 'שיווק',
    'field.hr': 'HR / גיוס',
    'field.finance': 'כספים / תפעול',
    'field.management': 'ניהול / הנהלה',
    'field.other': 'אחר',

    'seniority.student': 'סטודנט/ית',
    'seniority.junior': 'ג׳וניור',
    'seniority.mid': 'מנוסה (Mid)',
    'seniority.senior': 'סניור',
    'seniority.lead': 'מוביל/ה טכני/ת (Lead)',
    'seniority.manager': 'מנהל/ת צוות',
    'seniority.director': 'דירקטור/ית',
    'seniority.executive': 'הנהלה בכירה (VP / C-level)',
  },

  en: {
    'app.name': '7Tech',
    'app.demo': 'Demo',
    'app.offline': 'Offline',
    'common.role_at': '{title} at {company}',
    'common.see_company': '🏢 Everyone at {company}',
    'common.back': 'Back',
    'common.back_arrow': '← Back',
    'common.loading': 'Loading…',

    'tabs.label': 'Main navigation',
    'tabs.people': 'People',
    'tabs.companies': 'Companies',
    'tabs.jobs': 'Jobs',
    'tabs.me': 'My profile',
    'tabs.admin': 'Admin',

    'login.title': 'The {group} community',
    'login.tagline': 'The community directory: who works where, who can help, and how to connect in one tap.',
    'login.benefit_find': '🔎 Search by name, company, role or technology',
    'login.benefit_connect': '💬 Ready-made WhatsApp messages: questions, referrals, CV help',
    'login.benefit_update': '✏️ Update your own details any time',
    'login.email': 'Email',
    'login.send_code': 'Email me a login code',
    'login.code_sent': 'We sent a login code and link to {email}. Type the code here (or tap the link in the email).',
    'login.code': 'Code from the email',
    'login.verify': 'Log in',
    'login.change_email': 'Different email',
    'login.resend': 'Resend',
    'login.code_resent': 'A new code was sent',
    'login.demo_hint': 'Demo mode with made-up data. Log in as {email} (admin), or use any other email to try joining. Code: {code}',

    'directory.search_placeholder': 'Search: name, company, role, technology…',
    'directory.count': '{count} people',
    'directory.count_one': '1 person',
    'directory.no_results': 'Nobody found. Try other words or remove a filter.',
    'directory.show_more': 'Show more ({count})',
    'directory.looking_only': '🔍 Looking for work',
    'directory.more_filters': 'Field & seniority',
    'directory.clear_filters': 'Clear filters',
    'directory.company_filter': 'Company: {company}',
    'directory.any_field': 'Any field',
    'directory.any_seniority': 'Any seniority',
    'directory.any_course': 'Any course',
    'directory.my_course': '⚓ My course ({course})',

    'member.looking': 'Looking for work',
    'member.not_found': 'Profile not found',
    'member.not_found_hint': 'It may have been removed or not approved yet.',
    'member.edit_mine': 'Edit my profile',
    'member.offers_title': '{name} is happy to help with:',
    'member.skills': 'Skills & technologies',
    'member.connect': 'Get in touch',
    'member.no_phone': 'No phone number listed. Reach out by email or LinkedIn.',
    'member.open_jobs': 'Jobs they posted',
    'member.course': 'Course {course}',
    'member.seeking_title': 'Looking for',
    'member.prefers': 'Prefers to be contacted by: {methods}',

    'contact_method.whatsapp': 'WhatsApp',
    'contact_method.phone': 'Phone',
    'contact_method.email': 'Email',
    'contact_method.linkedin': 'LinkedIn',

    'contact.ask.hello': 'Say hi',
    'contact.ask.questions': 'Ask a question',
    'contact.ask.referrals': 'Ask for a referral (and send your CV)',
    'contact.ask.cv_review': 'Ask for CV feedback',
    'contact.ask.mock_interview': 'Ask for a mock interview',
    'contact.ask.mentoring': 'Ask for mentoring',
    'contact.whatsapp_to': 'WhatsApp {name}',
    'contact.email': 'Email',
    'contact.call': 'Call',
    'contact.save_contact': '📇 Save to contacts',
    'contact.share': '🔗 Share profile',
    'contact.link_copied': 'Link copied',

    'offer.referrals': 'Referrals to my company',
    'offer.questions': 'Answering questions',
    'offer.cv_review': 'CV feedback',
    'offer.mock_interview': 'Mock interviews',
    'offer.mentoring': 'Mentoring',

    'fresh.updated': 'Updated {when}',
    'fresh.stale': 'Updated {when}, may be outdated',
    'fresh.unconfirmed': 'From the old list, not confirmed by the member yet',

    'wa.hello': 'Hi {name}, this is {me} from the {group} group 👋',
    'wa.questions': 'Hi {name}, this is {me} from the {group} group. I saw your profile and wanted to ask a quick question: ',
    'wa.referrals': 'Hi {name}, this is {me} from the {group} group. I\'m looking for a role at {company} and would really appreciate a referral. Happy to send my CV. Thanks!',
    'wa.cv_review': 'Hi {name}, this is {me} from the {group} group. I saw you help with CVs. Would you have a few minutes to look at mine? 🙏',
    'wa.mock_interview': 'Hi {name}, this is {me} from the {group} group. I have an interview coming up. Would you have time for a short mock interview?',
    'wa.mentoring': 'Hi {name}, this is {me} from the {group} group. I\'d love your advice on my career. Would you have time for a short call?',
    'wa.job_referral': 'Hi {name}, this is {me} from the {group} group. I saw you posted a {title} role at {company} and would love a referral. Happy to send my CV. Thanks!',
    'wa.nudge': 'Hi {name}, this is {me} from the {group} admins 👋 Your directory profile hasn\'t been updated in a while. Got a minute to refresh it? {url}',
    'wa.your_company': 'your company',

    'companies.title': 'Companies',
    'companies.search_placeholder': 'Search companies…',
    'companies.count': '{count} companies',
    'companies.members': '{count} members',
    'companies.members_one': '1 member',
    'companies.referrers': '{count} can refer',
    'companies.referrers_one': '1 can refer',
    'companies.jobs': '{count} open jobs',
    'companies.jobs_one': '1 open job',
    'companies.looking': '{count} looking',
    'companies.no_results': 'No companies found.',

    'jobs.title': 'Community jobs',
    'linkedin.jobs_button': '🔎 LinkedIn jobs at companies where members work',
    'linkedin.jobs_hint': 'Opens a saved LinkedIn search. Found a role? Look the company up here and ask a member who works there for a referral.',
    'jobs.intro': 'Roles that group members can refer you to. Posts expire automatically after 30 days.',
    'jobs.post': '+ Post a role I can refer to',
    'jobs.company': 'Company',
    'jobs.role': 'Role',
    'jobs.url': 'Link to the posting (optional)',
    'jobs.details': 'Details (optional)',
    'jobs.expiry_hint': 'The post is shown for 30 days.',
    'jobs.publish': 'Publish',
    'jobs.published': 'Job posted',
    'jobs.empty': 'No open roles right now. Know one you can refer to? Post it!',
    'jobs.posted_by': 'Posted {when} by',
    'jobs.days_left': '{count} days left',
    'jobs.days_left_one': '1 day left',
    'jobs.ask_referral': 'Ask {name} for a referral',
    'jobs.view_posting': 'View posting',
    'jobs.delete': 'Delete',
    'jobs.delete_confirm': 'Delete this job post?',

    'me.title': 'My profile',
    'me.freshness_hint': 'An up-to-date profile helps people find you. If everything is still right, tap:',
    'me.still_accurate': '✓ My details are up to date',
    'me.confirmed': 'Thanks! Your profile is marked as up to date',
    'me.save': 'Save',
    'me.saved': 'Profile saved',
    'me.unconfirmed_hint': 'These details came from the old sheet. Check they are right and tap here (or edit and save below):',

    'join.title': 'Join the directory',
    'join.intro': 'We didn\'t find a profile with this email. Fill in your details and an admin will approve you. If you filled in the old form with another email, log in with that one instead.',
    'join.submit': 'Send join request',
    'join.sent': 'Request sent! You\'ll get in once it\'s approved.',

    'pending.title': 'Waiting for approval',
    'pending.body': 'We got your request. The directory opens once an admin approves it. You can still edit your details meanwhile.',
    'removed.title': 'Directory access closed',
    'removed.body': 'Your profile was removed from the directory. Contact the group admins with any questions.',

    'form.email_hint': 'Logged in as {email}. Your email is used to log in and is shown to members.',
    'form.full_name': 'Full name *',
    'form.course': 'Course / cohort',
    'form.course_placeholder': 'e.g. 115',
    'form.education': 'Education',
    'form.education_placeholder': 'e.g. B.Sc. Electrical Engineering, Technion',
    'form.seeking': 'What I\'m looking for right now',
    'form.seeking_placeholder': 'e.g. a data science role, networking, startup co-founders…',
    'form.contact_prefs': 'How I prefer to be contacted',
    'form.phone': 'Phone (for WhatsApp)',
    'form.linkedin': 'LinkedIn profile link',
    'form.company': 'Current company',
    'form.job_title': 'Job title',
    'form.field': 'Field',
    'form.seniority': 'Seniority',
    'form.choose': 'Choose…',
    'form.location': 'Area',
    'form.location_placeholder': 'e.g. Tel Aviv',
    'form.skills': 'Skills & technologies (comma separated)',
    'form.skills_placeholder': 'Python, React, product management',
    'form.bio': 'A few words about you',
    'form.bio_placeholder': 'What you work on, what interests you…',
    'form.offers': 'How I\'m happy to help community members',
    'form.looking': 'I\'m looking for a job',
    'form.looking_hint': 'Shows a "Looking for work" badge so people can find you with the filter',

    'error.name_required': 'Full name is required',
    'error.invalid_phone': 'Phone number is not valid (e.g. 050-1234567 or +972501234567)',
    'error.invalid_linkedin': 'LinkedIn link should look like linkedin.com/in/…',
    'error.unknown_field': 'Unknown field',
    'error.unknown_seniority': 'Unknown seniority',
    'error.unknown_offer': 'Unknown help option',
    'error.bio_too_long': 'About text is longer than 2000 characters',
    'error.seeking_too_long': '"Looking for" is longer than 500 characters',
    'error.unknown_contact': 'Unknown contact method',
    'error.bad_code': 'The code is wrong or expired. Try again or request a new one.',
    'error.rate_limited': 'Too many attempts. Wait a minute and try again.',
    'error.network': 'No internet connection. Please try again.',

    'settings.title': 'Settings',
    'settings.switch_to_he': 'עברית',
    'settings.switch_to_en': 'English',
    'settings.install': '📲 Install the app',
    'settings.ios_install_hint': 'On iPhone: in Safari tap the Share button, then "Add to Home Screen".',
    'settings.sign_out': 'Log out',
    'settings.delete_profile': 'Delete my profile from the directory',
    'settings.delete_confirm': 'Delete your profile permanently? Members will no longer be able to find you.',

    'admin.title': 'Admin',
    'admin.stat_members': 'Members',
    'admin.stat_pending': 'Pending',
    'admin.stat_looking': 'Looking for work',
    'admin.stat_stale': 'Not updated in 1+ year',
    'admin.stat_unconfirmed': 'Not confirmed yet',
    'admin.pending_title': 'Join requests',
    'admin.pending_empty': 'No pending requests.',
    'admin.requested': 'requested {when}',
    'admin.approve': 'Approve',
    'admin.reject': 'Reject',
    'admin.stale_title': 'Need updating',
    'admin.stale_hint': 'People who haven\'t confirmed their details from the old sheet, or haven\'t updated in over a year. Send a WhatsApp reminder.',
    'admin.stale_empty': 'Every profile is fresh 🎉',
    'admin.nudge': 'Remind',
    'admin.manage_title': 'Manage members',
    'admin.manage_placeholder': 'Search by name or email…',
    'admin.status_approved': 'active',
    'admin.status_pending': 'pending',
    'admin.status_removed': 'removed',
    'admin.remove': 'Remove',
    'admin.restore': 'Restore',
    'admin.export_csv': '⬇️ Export all members to CSV',
    'admin.companies_title': 'Companies for the LinkedIn filter',
    'admin.companies_hint': 'The LinkedIn jobs filter is maintained by hand. Copy the list of members\' companies to add new ones to it.',
    'admin.companies_copy': '📋 Copy company list',
    'admin.companies_copied': 'Company list copied',

    'field.backend': 'Backend development',
    'field.frontend': 'Frontend development',
    'field.fullstack': 'Full stack development',
    'field.mobile': 'Mobile development',
    'field.devops': 'DevOps / Cloud',
    'field.data': 'Data / AI / ML',
    'field.qa': 'QA / Testing',
    'field.security': 'Cyber security',
    'field.hardware': 'Hardware / Embedded',
    'field.product': 'Product management',
    'field.design': 'Design / UX',
    'field.project': 'Project management',
    'field.it': 'IT / Information systems',
    'field.sales': 'Sales / Business development',
    'field.marketing': 'Marketing',
    'field.hr': 'HR / Recruiting',
    'field.finance': 'Finance / Operations',
    'field.management': 'Management / Leadership',
    'field.other': 'Other',

    'seniority.student': 'Student',
    'seniority.junior': 'Junior',
    'seniority.mid': 'Mid-level',
    'seniority.senior': 'Senior',
    'seniority.lead': 'Tech lead',
    'seniority.manager': 'Team manager',
    'seniority.director': 'Director',
    'seniority.executive': 'Executive (VP / C-level)',
  },
};

let currentLang = readStoredLang();

function readStoredLang() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return LANGUAGES.includes(stored) ? stored : DEFAULT_LANG;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) throw new Error(`Unknown language: ${lang}`);
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

export function applyLang() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
}

function lookup(lang, key) {
  const value = STRINGS[lang][key];
  if (value === undefined) throw new Error(`Missing translation "${key}" for "${lang}"`);
  return value;
}

function interpolate(template, vars, wrapValue) {
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    if (!(name in vars)) throw new Error(`Missing variable "${name}" in "${template}"`);
    return wrapValue(String(vars[name]));
  });
}

function resolve(key, vars) {
  const pluralKey = `${key}_one`;
  const useSingular = vars.count === 1 && pluralKey in STRINGS[currentLang];
  return lookup(currentLang, useSingular ? pluralKey : key);
}

// Unicode isolates keep inserted names/companies from scrambling mixed Hebrew/English lines.
export function isolate(text) {
  return `\u2068${text}\u2069`;
}

// For text shown in the app.
export function t(key, vars = {}) {
  return interpolate(resolve(key, vars), vars, isolate);
}

// For text that leaves the app (WhatsApp messages): no invisible characters.
export function tPlain(key, vars = {}) {
  return interpolate(resolve(key, vars), vars, (value) => value);
}

// Maps known backend error messages to friendly text; unknown messages are shown as-is.
const KNOWN_ERRORS = [
  { pattern: /token has expired or is invalid/i, key: 'error.bad_code' },
  { pattern: /rate limit|only request this after|security purposes/i, key: 'error.rate_limited' },
  { pattern: /failed to fetch|networkerror|load failed/i, key: 'error.network' },
];

export function friendlyError(message) {
  const known = KNOWN_ERRORS.find((entry) => entry.pattern.test(message));
  return known === undefined ? message : t(known.key);
}

// Used by search so "backend" and "פיתוח Backend" both find the same people.
export function labelsInAllLanguages(key) {
  return LANGUAGES.map((lang) => lookup(lang, key));
}

export function relativeDays(rawDays) {
  const days = Math.max(0, rawDays); // a clock slightly ahead of the server must not say "in 1 day"
  const format = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });
  if (days < 30) return format.format(-days, 'day');
  if (days < 365) return format.format(-Math.floor(days / 30), 'month');
  return format.format(-Math.floor(days / 365), 'year');
}

// Exposed for scripts/check_i18n.mjs.
export const STRINGS_FOR_TESTS = STRINGS;
