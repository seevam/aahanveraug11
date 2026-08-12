# Ahaan Eye — "Impact an Eye Every Day" 👁️

A local-first mobile app that helps patients — and the family members who care
for them — follow complex eye-drop schedules. It generates conflict-free
schedules automatically, reminds you when a dose is due, records every dose as
Taken / Snoozed / Skipped / Missed, and turns that history into an adherence
report you can share with a doctor.

Built with Expo SDK 54 (React Native) for **iOS and Android from one codebase**.

---

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. No backend to start, no
database to provision — the app is self-contained.

### Which SDK, and why it matters

Expo Go is a fixed binary in the App Store / Play Store, and each release
supports **exactly one** Expo SDK. Its release cycle is independent of the
`expo` npm package, so **npm's `latest` tag is not a guide to what Expo Go can
run** — at the time of writing npm publishes SDK 57 while the store ships Expo
Go 54.0.2.

This project therefore targets **SDK 54**, pinned via `sdkVersion` in
`app.json`.

Before changing the SDK, check what the store actually ships:

```bash
curl -s "https://itunes.apple.com/lookup?id=982107779" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['results'][0]['version'])"
```

Targeting an SDK *above* what Expo Go ships gives "Project is incompatible with
this version of Expo Go — requires a newer version". Targeting one *below* gives
the mirror-image error. A development build removes the constraint entirely.

### Other commands

```bash
npm test          # run the scheduling, conflict, timezone and adherence tests
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
    conflict.ts           The 5-minute washout gap
    timezone.ts           The only module that knows about DST
    adherence.ts          Adherence maths and streaks
  db/                     SQLite schema, migrations, repositories
  notifications/          The single seam onto expo-notifications
  services/               Orchestration: sync, dose actions, backup, security
  medications/            Bundled India-market eye-drop catalogue
  components/             Design-system components
  theme/                  Colour, type and spacing tokens
  i18n/                   English, Hindi, Tamil

tests/                    68 unit tests over src/scheduling
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

### The 5-minute gap

Two different eye drops instilled together wash each other out, so
ophthalmology guidance is a minimum gap — commonly 5 minutes — between
different drops. The conflict resolver walks a day's doses in order and pushes
each one forward to at least `previous + 5 minutes`.

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

**The alarm experience cannot be symmetric across the two platforms.** Android's
full-screen intent over the lock screen has no iOS equivalent. Today the app
uses `interruptionLevel: 'timeSensitive'` on iOS and a MAX-importance channel on
Android, which is as far as `expo-notifications` goes.

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

## Medication catalogue

`src/medications/catalogue.ts` bundles ~55 common Indian ophthalmic
medications — glaucoma, lubricants, antibiotics, steroids, NSAIDs,
anti-allergy, dilating and antiviral drops — with generic names, common Indian
brand names and typical strengths.

It is an autocomplete convenience, not a formulary. Free text is always
accepted, and the prescription on the bottle always wins.

---

## Not built

Carried over from the product plan and deliberately out of scope here:
server-side push, caregiver alerts to another phone, doctor web portal,
prescription OCR, donations, appointments, and the stories/content feed.

There are no accounts and no phone verification, because there is no server to
verify against. The optional PIN/biometric lock is a privacy screen over health
data on a shared phone — not authentication.
