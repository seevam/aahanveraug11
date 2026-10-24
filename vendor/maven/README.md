# Vendored Gradle plugin

`io.invertase.gradle.build` 1.5 — required by `@notifee/react-native`'s own
`android/build.gradle`. Downloaded unmodified from the Gradle Plugin Portal
(https://plugins.gradle.org/plugin/io.invertase.gradle.build).

Vendored because resolving it through a rate-limited network proxy fails
intermittently, and the plugin is small with no transitive dependencies.
`plugins/withAlarmSupport.js` puts this directory first in
`pluginManagement.repositories`.

| File | SHA-256 |
|---|---|
| `gradle/plugin/io/invertase/gradle/react-native/1.5/react-native-1.5.jar` | `03cd874b23c96326a8786413a59022d60addc14751da95657134572b0d4fc395` |

To verify: `sha256sum vendor/maven/gradle/plugin/io/invertase/gradle/react-native/1.5/react-native-1.5.jar`
