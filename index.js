// Custom entry point.
//
// Notifee's background event handler has to be registered before the app
// mounts, which `expo-router/entry` does on import — so the import order here
// is load-bearing, not incidental.
import './src/notifications/background';

import 'expo-router/entry';
