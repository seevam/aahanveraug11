const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withSettingsGradle,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Everything a real alarm needs on Android that app.json cannot express.
 *
 * Three separate things, and all three are required — missing any one of them
 * leaves you with a notification that happens to be loud:
 *
 *  1. USE_FULL_SCREEN_INTENT, so the notification may launch an activity
 *     instead of only showing a banner.
 *  2. showWhenLocked + turnScreenOn on the main activity, so that activity can
 *     appear over the lock screen and wake the display. Without these the
 *     full-screen intent fires into a screen nobody can see.
 *  3. The alarm tone copied into res/raw, which is the only place Android will
 *     look for a notification channel sound.
 *
 * Note on Android 14+: declaring USE_FULL_SCREEN_INTENT is no longer enough.
 * Only calling and alarm-clock apps are granted it at install; everything else
 * has to be allowed by the user under Special app access. The app asks for
 * that at runtime — see `src/notifications/service.ts`.
 */

const ALARM_SOUND = 'alarm_tone.wav';

function withFullScreenIntentPermission(config) {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.USE_FULL_SCREEN_INTENT',
  ]);
}

function withLockScreenActivity(config) {
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    activity.$['android:showWhenLocked'] = 'true';
    activity.$['android:turnScreenOn'] = 'true';
    // An alarm must not be dismissed by the task switcher.
    activity.$['android:excludeFromRecents'] = 'false';
    return cfg;
  });
}

function withAlarmSound(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const source = path.join(cfg.modRequest.projectRoot, 'assets', 'sounds', ALARM_SOUND);
      if (!fs.existsSync(source)) {
        throw new Error(
          `withAlarmSupport: alarm tone missing at ${source}. ` +
            'The notification channel references it by name, so the build must not continue without it.',
        );
      }

      const rawDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw',
      );
      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(source, path.join(rawDir, ALARM_SOUND));
      return cfg;
    },
  ]);
}

/**
 * Notifee's own build.gradle applies `io.invertase.gradle.build`, which
 * Invertase publishes to JitPack rather than Maven Central or the Gradle
 * Plugin Portal. Expo's generated settings.gradle declares no
 * pluginManagement repositories at all, so plugin resolution only ever
 * searches the Portal and the build dies at configuration time.
 */
function withPluginRepositories(config) {
  return withSettingsGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes('jitpack.io')) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      'pluginManagement {',
      `pluginManagement {
  repositories {
    gradlePluginPortal()
    google()
    mavenCentral()
    // Hosts io.invertase.gradle.build, required by @notifee/react-native.
    maven { url 'https://jitpack.io' }
  }
`,
    );
    return cfg;
  });
}

module.exports = function withAlarmSupport(config) {
  return withPluginRepositories(
    withAlarmSound(withLockScreenActivity(withFullScreenIntentPermission(config))),
  );
};
