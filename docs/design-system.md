# 7Tech design system: "Deep Water"

Phase 1 deliverable: the design language, interaction model and user journeys for the 7Tech directory.
Tokens live in [`web/css/tokens.css`](../web/css/tokens.css), components in
[`web/css/components.css`](../web/css/components.css), and the living style guide is
[`docs/styleguide.html`](styleguide.html) (open it through a local server: `npm run serve:docs`).

## 1. Principles

1. **One thumb, one tap.** Every primary action (search, filter, message someone) is reachable with a thumb
   and takes one tap. Nothing important lives behind a long press or a hover.
2. **Calm surface, alive on touch.** Screens are quiet: lots of white (or black), one accent color. Motion appears
   only as a response to the user, never to decorate.
3. **Show, then send.** Before anything leaves the app (a WhatsApp message, a shared link), the user sees exactly
   what will be sent.
4. **Hebrew first, English equal.** RTL is the default layout; every component is built with logical properties
   (`inline-start/end`) so English (LTR) works without special cases.
5. **Honest data.** Freshness ("updated 3 months ago", "not confirmed yet") is always visible; nothing pretends
   to be newer than it is.

## 2. Aesthetic & layout

### Brand, from the logo
| Logo element | Token | Role in the UI |
|---|---|---|
| Black water | `--color-abyss` `#05070D` | Dark-theme background, app icon, splash |
| Navy sail | `--color-sail` | The single **interactive** color: buttons, links, focus ring, active tab |
| Olive-brass hull | `--color-brass` | **Identity** accents: course badge ⚓, "my course" chip, admin highlights |
| Light, wide "7TECH" | Heebo 300, `--tracking-wordmark` | Wordmark and uppercase section overlines |

### Color palette
Each token holds a light and a dark value (`light-dark()`); the theme follows the device, with a manual
System / Light / Dark switch in settings. Dark mode is the brand's "hero" look (it is the logo).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#F5F6FA` | `#05070D` | Page background |
| `--color-surface` | `#FFFFFF` | `#0E1322` | Cards, sheets, inputs |
| `--color-surface-2` | `#EDEFF5` | `#161C2F` | Chips, skeletons, pressed rows |
| `--color-border` | `#D5DAE6` | `#2A3250` | Hairlines, input borders |
| `--color-text` | `#0B1020` | `#ECEEF6` | Primary text |
| `--color-text-muted` | `#535A70` | `#9AA1B8` | Secondary text, meta |
| `--color-sail` | `#2F3F96` | `#8E9CFF` | Primary actions, links, focus |
| `--color-sail-soft` | `#E6E9FA` | `#1C2350` | Secondary buttons, selected chips (soft) |
| `--color-brass` / `-text` / `-soft` | `#97844F` / `#6B5C2B` / `#F4EFDF` | `#C9B67E` / `#D6C691` / `#2A2617` | Identity accents |
| `--color-success` (+ soft) | `#0F7A40` | `#3DDC84` | WhatsApp actions, success |
| `--color-warning` (+ soft) | `#8A5A00` | `#F5C86B` | Stale profiles |
| `--color-danger` (+ soft) | `#B42318` | `#FF8A80` | Errors, destructive actions |

Rules: one filled sail button per screen (the primary action); WhatsApp green is reserved for "message this
person"; brass never carries body text in light mode (it is decorative there; `--color-brass-text` is for text).
All text pairs meet **WCAG AA (≥ 4.5:1)** in both themes, enforced by `node scripts/check_contrast.mjs` in CI.

### Typography
**Heebo** (variable, Hebrew + Latin, OFL, self-hosted ~42 KB so it works offline). Its geometric shapes echo the
logo's wordmark. Body text is never below 16 px (iOS zooms into smaller inputs).

| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-3xl` | 34 | 700 | Profile name, login hero |
| `--text-2xl` | 28 | 700 | Page title |
| `--text-xl` | 23 | 600 | Section title |
| `--text-lg` | 19 | 600 | Card title (person's name) |
| `--text-md` | 16 | 400 | Body, inputs, buttons |
| `--text-sm` | 14 | 400/500 | Secondary lines, chips |
| `--text-xs` | 12 | 500, uppercase, tracked | Overlines ("COURSE 115"), timestamps |

Line height 1.5 for body, 1.2 for headings. Numbers use `tabular-nums` in stats.

### Space, shape, elevation
- **4 px grid**: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Page gutter 16; gap between cards 12; inside cards 16.
- **Radii**: inputs 8, list buttons 12, cards 16, sheets 24, chips/buttons pill.
- **Elevation**: level 1 = resting card, level 2 = hover/raised (sticky search, tab bar), level 3 = sheets and
  toasts. In dark mode shadows become a faint lit hairline, because shadows disappear on black.
- **Touch targets** ≥ 44 × 44 px; adjacent targets ≥ 8 px apart.

### Layout
- **Phone (default)**: top app bar (wordmark), sticky search on People, bottom tab bar with 4 tabs:
  People · Companies · Jobs · Me. Admin tools move into "Me" (shown only to admins), one less tab for everyone.
- **Tablet/desktop (≥ 900 px)**: the tab bar becomes a side rail on the inline-start edge; People becomes
  two panes, list plus the selected profile, so browsing never loses the list.
- Content width max 680 px on single-pane screens.

## 3. Interactivity & feedback

### State model (every interactive component)
| State | Visual | Timing |
|---|---|---|
| Rest | As specified | |
| Hover (pointer devices only) | Background tints toward sail-soft; cards rise to elevation 2 | 140 ms standard |
| Pressed | `scale(0.97)` + darker tint, feels physical | 80 ms in, 140 ms out |
| Focus (keyboard) | 2 px sail ring with 2 px gap (`:focus-visible` only) | instant |
| Disabled | 45 % opacity, `cursor: not-allowed`, `aria-disabled` | |
| Loading | Label stays, a spinner replaces the icon, width locked (no layout jump), `aria-busy` | |
| Success | Spinner morphs into a ✓ with a small pop, then returns to rest after 1.2 s | 220 ms pop |
| Error | Field: red border + message under it, linked with `aria-describedby`; form: one gentle shake, focus moves to the first invalid field | 300 ms |

### Signature micro-interactions
- **Sonar ping**: the brand motion. Concentric rings expand from the submarine mark while loading, on empty
  states, and in the login hero. It replaces generic spinners for page-level waits.
- **Skeleton cards**: the directory never shows a blank screen. Cached data renders instantly; on first load,
  shimmering placeholders keep the layout stable.
- **Live search**: results filter as you type; matching text is highlighted (`<mark>`); the result count
  updates in an `aria-live` region; "no results" offers to clear filters in one tap.
- **Filter chips**: toggle with a check that pops in (`--ease-pop`) and a fill transition; the "clear" chip
  appears only when something is active.
- **Card → profile**: the avatar and name glide from the card into the profile header (View Transitions API),
  falling back to a 220 ms fade-slide.
- **Connect sheet**: "Message" opens a bottom sheet listing what this person offers (ask a question, referral,
  CV feedback…). Choosing one shows a **preview of the exact WhatsApp text**; "Open WhatsApp" sends it there.
  The sheet supports swipe-down to close, Esc, and the scrim tap.
- **Toasts**: slide up above the tab bar, a single toast at a time, auto-dismiss after 3.5 s, tappable to
  dismiss, announced by screen readers (`role="status"`). Errors offer a "Try again" action.
- **Tab bar**: the active pill slides between tabs; tapping the active tab scrolls to top.
- **Haptics** (Android): a 10 ms tick on toggles, copy and successful send.
- **Reduced motion**: all durations collapse to near zero and press-scale is disabled; nothing relies on
  motion to convey meaning.

## 4. Usability: zero-friction journeys

### First login (imported member, the launch-day journey)
1. Open the link from WhatsApp → **login**: one email field, autofocused, with the keyboard already on email.
2. **Code**: six separate digit boxes, auto-advance, paste-anything support, SMS/email autofill
   (`autocomplete="one-time-code"`), auto-submit on the sixth digit. "Resend" unlocks after 30 s with a countdown.
3. **"Is this you?"** (new): their imported card shown as others will see it, with **"✓ Looks right"** and
   **"Edit"**. Confirming takes one tap and marks the profile fresh.
4. Land on People. A one-time hint suggests "Add to Home Screen".

### Find someone and ask for help (core journey: 3 taps)
People → type "wix" (or tap "⚓ My course") → tap a card → **Message** → pick "Ask for a referral" → preview
→ **Open WhatsApp**.

### Keep my profile fresh
Me → the card at the top shows freshness and **"✓ Still accurate"** (one tap). Editing uses grouped sections
(About · Work · How I can help · How to reach me); a **sticky save bar** appears only when something changed,
and leaving with unsaved changes asks first.

### Navigation & hierarchy
- Four tabs, each with one job: **find people, browse companies, find jobs, manage me**.
- Every screen has one title, one primary action, and a back affordance on inner pages (the device back
  gesture also works, since routes are real URLs).
- Progressive disclosure: field, seniority and course filters sit behind "More filters"; the most-used filters
  (my course, looking for work, gives referrals) are always-visible chips.

### Accessibility checklist
- Contrast AA in both themes (automated). Never color alone: status also uses icon + text.
- Semantic landmarks (`header`, `nav`, `main`), one `h1` per screen, lists as lists.
- Dialogs and sheets use native `<dialog>`: focus moves in, is trapped, returns to the trigger on close.
- Every icon-only button has an `aria-label`; toggles use `aria-pressed`; the current tab uses `aria-current`.
- Live regions for result counts and toasts; `aria-busy` on loading buttons and lists.
- Text scales with the system font size (rem units); layout tolerates 200 % zoom.
- Full keyboard path on desktop; visible focus only for keyboard users.
- RTL/LTR mirrored automatically; phone numbers, emails and URLs are always LTR-isolated.

## 5. Implementation (Phase 2, done)
| Spec item | Where |
|---|---|
| Tokens, components, app layout | `web/css/tokens.css`, `components.css`, `app.css` (old `styles.css` removed) |
| Icons (one stroke style) | `web/js/icons.js`; app icons regenerated from `web/icons/logo-mark.svg` |
| System / Light / Dark switch | `web/js/theme.js`, Me → Settings; saved per device, applied before first paint |
| Loading → success buttons, toasts with action, haptics, search highlight | `web/js/ui.js` |
| Person card, connect sheet with preview + swipe-to-close, fields with inline errors, skeletons, sonar empty states | `web/js/components.js` |
| OTP boxes (auto-advance, paste, autofill, auto-submit) + resend countdown | `web/js/views/login.js` |
| "Is this you?" for imported members | `renderConfirm` in `web/js/views/me.js` |
| Grouped profile form, sticky save bar, unsaved-changes guard | `web/js/views/profile-form.js`, `navigate()` in `web/js/app.js` |
| 4 tabs with sliding indicator (admin inside Me), tap-to-top | `createTabbar()` in `web/js/app.js` |
| Desktop side rail + two panes (list keeps search/scroll) | `showSplit()` in `web/js/app.js`, `@media (min-width: 900px)` in `app.css` |
| Avatar glides card → profile (View Transitions) | `navigate()` / `prepareProfileTransition()` in `web/js/app.js` |
| Accessibility gate | `scripts/smoke_test.cjs` runs axe on every screen in light + dark; serious/critical issues fail CI |
