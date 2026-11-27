# Publishing Eyedrop Scheduler on Google Play

A checklist from where things stand to the app being live. Steps marked
**(you)** need the Play Console account holder; everything else is prepared in
this repository.

## What is already prepared

| Item | Where |
| --- | --- |
| Signed app bundle for upload (`.aab`) | Sent in chat; rebuild with `./gradlew bundleRelease` |
| Upload key (keystore + passwords) | Sent in chat — **keep it safe, never commit it** |
| Store listing text (English, Hindi, Tamil) | `store/play/listing.md` |
| 512 × 512 icon, 1024 × 500 feature graphic | `store/play/` |
| Privacy policy | `PRIVACY.md`, hosted page in `docs/` (needs step 2) |
| Play-safe permissions | `app.json` — see README, "Publishing" |

## 1. Finish developer account verification (you)

Play Console will not let you publish until identity verification passes.
The name, address and document must all be the account holder's and match
exactly — see the earlier notes on the "issues with the verification info"
error. Google requires the account holder to be 18 or over.

## 2. Put the privacy policy online (you, 2 minutes)

GitHub → this repository → **Settings → Pages** → Source: **Deploy from a
branch** → Branch: `claude/mobile-app-android-ios-c0xoho`, folder **/docs** →
Save. After a minute or two, <https://seevam.github.io/aahanveraug11/> shows
the policy. Google checks that this link works.

## 3. Create the app (you)

Play Console → **Create app**:

- App name: **Eyedrop Scheduler**
- Default language: **English (India) – en-IN**
- App or game: **App** · Free or paid: **Free**
- Tick the declarations → **Create app**

## 4. Store listing (you)

**Grow users → Store presence → Main store listing**: paste from
`store/play/listing.md`, then upload:

- App icon: `store/play/icon-512.png`
- Feature graphic: `store/play/feature-graphic.png`
- Phone screenshots: **2 to 8**, taken on a phone (power + volume-down).
  Suggested: Today screen, the alarm screen, adding a reminder, the
  reminder preview, reports, Profile → Alarm setup. Use example names, not
  real patients. Hindi and Tamil screenshots can go in the translations.

Add Hindi and Tamil under **Manage translations**. Then **Store settings**:
category **Medical**, contact email.

## 5. App content declarations (you)

**Policy → App content**. Answers for this app:

- **Privacy policy**: `https://seevam.github.io/aahanveraug11/`
- **App access**: all functionality is available without special access
  (no login; the PIN lock is optional and off by default)
- **Ads**: no ads
- **Content rating**: fill in the questionnaire; answer No to violence,
  sexual content, gambling, user interaction and so on. Expect "Everyone" / 3+
- **Target audience**: **18 and over** (keeps the app out of the Families
  programme's extra rules; it is meant for adults and caregivers)
- **News app**: no · **Government app**: no · **Financial features**: none
- **Data safety**: the app does **not collect or share** user data. Everything
  stays on the phone; backups and reports leave only when the user shares them.
  The how-to videos are streamed from Google Drive when opened, as described in
  the privacy policy; no user data is sent with them
- **Health apps**: declare it as a medication / treatment management app
- **Full-screen intent** (asked once the bundle is uploaded): the app's core
  function is a medication **alarm** that must wake the user and show on the
  lock screen. If Google does not accept it, the app still rings, as a loud
  notification instead of a full-screen alarm

## 6. Closed test: 12 testers for 14 days (you)

Required for personal developer accounts created after 13 November 2023.

1. **Test and release → Testing → Closed testing → Create track**
2. **Countries**: India (and anywhere your testers are)
3. **Testers**: create an email list with **at least 12, ideally 15+** Gmail
   addresses of real people with Android phones
4. **Create release**: let Google manage the app signing key (Play App
   Signing, the default) → upload `app-release.aab` → release name `1.0.0 (1)`
   → short release notes → **Review release → Start rollout**
5. Wait for review (hours to a few days), then copy the **opt-in link** from
   the track and send it to the testers
6. Each tester: open the link on their Android phone → **Become a tester** →
   install from Google Play. Anyone with the sideloaded APK must uninstall it
   first — it is signed differently, so Play cannot update it
7. Keep at least 12 testers opted in for **14 days in a row**. Ask them to use
   the app — add a reminder, answer an alarm — and send you feedback; Google
   asks about it

## 7. Apply for production (you)

After 14 days: **Dashboard → Apply for production** and answer the questions
about the test. Google reviews it, usually within about a week.

## 8. Release to everyone (you)

**Production → Create release** → add the same bundle (or a newer one) →
countries → **Start rollout**. A staged rollout (for example 20% first) limits
the damage if something is wrong. Each release is reviewed again.

## Updating the app later

- Raise `android.versionCode` in `app.json` (1 → 2 → 3 …) and `version` for
  the name people see. Play rejects a bundle whose version code it has seen.
- Sign every update with the **same upload key**. The build machine needs, in
  `~/.gradle/gradle.properties` (never in the repository):

  ```
  EYEDROP_UPLOAD_STORE_FILE=/absolute/path/to/upload-keystore.jks
  EYEDROP_UPLOAD_STORE_PASSWORD=...
  EYEDROP_UPLOAD_KEY_ALIAS=upload
  EYEDROP_UPLOAD_KEY_PASSWORD=...
  ```

- Build: `npx expo prebuild --platform android --clean`, then in `android/`:
  `./gradlew bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64`.
  The bundle is at `android/app/build/outputs/bundle/release/app-release.aab`.
- Lost the upload key? Play Console support can register a new one (Play App
  Signing keeps the real signing key with Google), but it takes days.
