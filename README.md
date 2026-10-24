# Eyedrop Scheduler 👁️

A local-first mobile app that helps patients — and the family members who care
for them — follow complex eye-drop schedules. It generates conflict-free
schedules automatically, reminds you when a dose is due, records every dose as
Taken / Snoozed / Skipped / Missed, and turns that history into an adherence
report you can share with a doctor.

Built with Expo SDK 57 (React Native) for **iOS and Android from one codebase**.

---

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. No backend to start, no
database to provision — the app is self-contained.

### Which SDK, and why it matters

Expo Go is a fixed binary from the App Store / Play Store, and each release
supports **exactly one** Expo SDK. Target a different one and it refuses to
open the project:

- project SDK **higher** than Expo Go → "requires a newer version of Expo Go"
- project SDK **lower** than Expo Go → "requires an older version of Expo Go"

**Check the version on the phone, not from an API.** Open Expo Go and read the
version on its home screen. Its major number *is* the SDK it supports, so Expo
Go 57.x runs SDK 57 projects. Store-listing APIs cache aggressively and have
returned a months-stale version here, which is exactly how this project ended
up briefly pinned to the wrong SDK.

`app.json` deliberately does **not** set `sdkVersion`; it is derived from the
installed `expo` package so the two can never drift apart. To move SDKs, change
the `expo` dependency and run:

```bash
npx expo install --fix   # realign every expo-* package
npx expo-doctor          # catch config fields the new schema dropped
```

Then rebuild the tree from scratch — `rm -rf node_modules package-lock.json &&
npm install` — because React, React Native and every Expo package change
version together.

A development build removes this constraint entirely: it pins its own SDK and
never has to agree with a store binary.

### Other commands

```bash
npm test          # scheduling, conflict, timezone, adherence, alarm allocation
npm run typecheck # tsc --noEmit
npx expo-doctor   # check the project against the installed SDK
```

---

## How it is put together

```
app/                      Screens (expo-router, file-based)
  _layout.tsx             Providers, notification listeners, resume sync
  onboarding.tsx          Language → who the drops are for → notifications
  lock.tsx                PIN / biometric gate
  (tabs)/                 Today · Reminders · Reports · Profile
  reminder/               Create and edit
  patient/new.tsx         Add a person
  dose/[id].tsx           Full-screen dose prompt

src/
  scheduling/             Pure logic — no React, no SQLite, fully tested
    engine.ts             Generates the times a reminder asks for
    conflict.ts           The washout gap between different drops
    timezone.ts           The only module that knows about DST
    adherence.ts          Adherence maths and streaks
  db/                     SQLite schema, migrations, repositories
  notifications/          The single seam onto expo-notifications
  services/               Orchestration: sync, dose actions, backup, security
  components/             Design-system components
  theme/                  Colour, type and spacing tokens
  i18n/                   English, Hindi, Tamil

tests/                    84 unit tests over the pure logic
```

The layering rule: **`src/scheduling` never imports from `src/db`, `src/components`
or anything native.** That is what lets the riskiest logic in the app run under
plain Node in milliseconds.

---

## The scheduling engine

Three schedule modes:

| Mode | Example |
|---|---|
| **Fixed interval** | every 2 hours between 08:00 and 20:00 → 7 doses |
| **Count-based** | 5 times, 10 minutes apart, from 09:00 |
| **Specific times** | 08:00 and 20:00 |

Each can be restricted to particular days of the week, and given a start and
end date.

### The washout gap

Two different eye drops instilled together wash each other out, so
ophthalmology guidance is a minimum gap between different drops. This app
uses **6 minutes** — the common published minimum is five, and the extra
minute is headroom for a patient who is slow with the second bottle. The
conflict resolver walks a day's doses in order and pushes each one forward to
at least `previous + 6 minutes`.

Two decisions worth knowing about:

- **Order is preserved.** Doses only ever move forward, so a prescribed
  sequence stays in sequence.
- **Impossible schedules fail loudly.** If a dose would have to move more than
  an hour, or past midnight, the app says so in plain language rather than
  silently relocating a morning dose to the afternoon.

Conflict resolution runs across *all* of a patient's reminders at once. Doing it
per-reminder would never detect a collision between two different drops, which
is the entire point.

---

## Notifications, and what Expo Go can and cannot do

Reminders are **local notifications** scheduled on-device. Nothing is sent from
a server, so they work with no connectivity.

Two platform realities the code is built around:

**iOS caps pending local notifications at 64** and silently drops the rest. A
patient on 4 drops × 5 doses/day would exhaust that in three days. So the app
keeps a **rolling window** of the soonest 56 doses and re-arms it on launch, on
resume, after any dose action, and after each notification fires. Doses
themselves are materialised into SQLite 21 days ahead, independently of what is
armed.

**Alarms use the loudest route each platform allows without a custom build.**

On Android the channel is routed to the **ALARM audio stream** with
`enforceAudibility`, so a dose rings at the phone's *alarm* volume — the one
people keep turned up to wake themselves — not the notification volume, and the
ringer switch does not mute it. Importance is MAX, the channel asks to bypass
Do Not Disturb, and the vibration pattern is long-pulse.

One thing to know when changing this: **Android notification channels are
immutable after creation.** Editing importance, sound or audio routing on an
existing channel is silently ignored so the user stays in control of their own
settings. Changing any of it means publishing a new channel id — hence the
`-v2` suffix on `ANDROID_CHANNEL_ID` — and deleting the old one. Bump the
suffix whenever the channel config changes, or existing installs keep the old,
quieter behaviour forever.

On iOS the ceiling without a special entitlement is `timeSensitive`, which
pierces Focus but still respects the silent switch. `critical` — which breaks
through silent mode at a volume the app chooses — needs Apple's **Critical
Alerts entitlement**, granted by application. The code is ready for it behind
`IOS_CRITICAL_ALERTS_ENTITLED`; flip that in the same change that adds the
approved entitlement.

Still out of reach in Expo Go, and needing a development build: a **continuous
ring until dismissed**, a **custom alarm sound**, and Android's **full-screen
intent** that takes over the lock screen.

### Moving to true alarms later

`src/notifications/service.ts` is the only module that imports
`expo-notifications`. The rest of the app depends on three functions —
`scheduleDose`, `cancelDose`, `configure`. Swapping in Notifee means
reimplementing that file and nothing else.

That step requires a development build (`eas build --profile development`),
because Notifee cannot run in Expo Go. Two things also become real at that
point, and are already stored per-reminder so no schema change is needed:

- **Custom alarm sounds** — in Expo Go you get the system notification sound.
- **Full-screen intent** — `app/dose/[id].tsx` is already the screen an alarm
  would open; today it is reached by tapping the notification.

For iOS parity beyond Time Sensitive, Apple's **Critical Alerts** entitlement is
needed. It is granted by application, not by config.

---

## Data

Everything lives on the phone in SQLite. Nothing is uploaded anywhere.

That means the phone is the only copy, so **Profile → Backup** exports a
versioned JSON file the patient can save and restore on a new device. Import
replaces all data inside a single transaction — a half-restored medication
schedule would silently drop doses.

Editing a reminder rebuilds only *future pending* doses. Anything already
taken, skipped or missed is never rewritten, because that history is what a
doctor reads.

### Adherence

`taken / (taken + missed + skipped)`. Future `pending` and unresolved `snoozed`
doses are excluded from the denominator — counting a dose the patient has not
yet had the chance to take would show a new user 0% and would be wrong.
Deliberate skips *do* count against the rate: a skip is still a dose the eye did
not receive.

---

## Accessibility

The audience is patients with eye conditions, often older, often with imperfect
hands and imperfect vision. The design rules are enforced in
`src/theme/tokens.ts`:

- Nothing tappable is smaller than **48dp**; primary dose actions are 64dp.
- Body text starts at **17pt** and respects the OS font-size setting.
- Every colour pair clears **WCAG AA** in both light and dark.
- Status is never conveyed by colour alone — every state carries an icon and a
  text label.
- Missed doses are stated as fact, never as blame.

---

## Languages

English, Hindi and Tamil, auto-detected from device locale on first launch and
switchable in Profile.

`src/i18n/locales/en.ts` is the typed source of truth: `hi.ts` and `ta.ts` are
typed against its shape, so adding an English key breaks the build until it is
translated. A silent English fallback would put text in front of a patient who
cannot read it.

> The Hindi and Tamil strings need a native-speaker and clinician review before
> public launch, particularly the validation messages, where a misread message
> could lead to a wrong schedule.

---

## Publishing

- Privacy policy: [`PRIVACY.md`](PRIVACY.md), with a hosted copy in
  [`docs/`](docs/index.html) for GitHub Pages — Google Play requires a public
  URL for it.
- Application id is **`com.eyedropscheduler.app`** on both platforms. This is
  permanent once the app is published to either store; it cannot be renamed or
  reused afterwards.
- `USE_EXACT_ALARM` **is** requested, for the sideloaded APK: Android grants it
  at install, so exact alarm timing needs no setup. **Review before a Play
  Store release** — Google restricts it to apps whose core purpose is an alarm
  clock or calendar, and a medication reminder may be rejected. To drop it,
  remove it from `android.permissions` in `app.json`; the app then falls back
  to `SCHEDULE_EXACT_ALARM`, and Profile → Alarm setup walks the user through
  granting it.
- Reminders can ring through the phone's own **Clock app** (Profile → Alarm
  setup → Ring reminders with). The app creates the alarms with Android's
  `AlarmClock` intents (`modules/clock-alarms/`). Android does not let apps
  read or delete Clock alarms, so the app records what it has added and lists
  the ones the user must delete by hand after a schedule change. In this mode
  the app's own notification is silent and exists only to record Taken/Skip.

## Not built

Carried over from the product plan and deliberately out of scope here:
server-side push, caregiver alerts to another phone, doctor web portal,
prescription OCR, donations, appointments, and the stories/content feed.

There are no accounts and no phone verification, because there is no server to
verify against. The optional PIN/biometric lock is a privacy screen over health
data on a shared phone — not authentication.
