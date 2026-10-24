package expo.modules.clockalarms

import android.content.Context
import android.content.Intent
import android.provider.AlarmClock
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Creates alarms in the phone's own Clock app, through Android's public
 * AlarmClock intents.
 *
 * Android deliberately offers no way to read, edit or delete another app's
 * alarms. ACTION_DISMISS_ALARM exists but only skips the next ring of a
 * repeating alarm, so it is not exposed here: removing a Clock alarm is the
 * user's job, and the app tells them which ones.
 */
class ClockAlarmsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ClockAlarms")

    Function("isAvailable") {
      Intent(AlarmClock.ACTION_SET_ALARM).resolveActivity(context.packageManager) != null
    }

    /**
     * `days` uses java.util.Calendar numbering (Sunday = 1 … Saturday = 7).
     * It is always sent: without EXTRA_DAYS the Clock app creates a one-off
     * alarm that rings once and never again.
     */
    AsyncFunction("setAlarm") { hour: Int, minute: Int, label: String, days: List<Int>, vibrate: Boolean, silent: Boolean ->
      val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
        putExtra(AlarmClock.EXTRA_HOUR, hour)
        putExtra(AlarmClock.EXTRA_MINUTES, minute)
        putExtra(AlarmClock.EXTRA_MESSAGE, label)
        putIntegerArrayListExtra(AlarmClock.EXTRA_DAYS, ArrayList(days))
        putExtra(AlarmClock.EXTRA_VIBRATE, vibrate)
        if (silent) putExtra(AlarmClock.EXTRA_RINGTONE, AlarmClock.VALUE_RINGTONE_SILENT)
        // Create it without opening the Clock app's editor. Honoured by most
        // Clock apps; the few that ignore it show their editor instead.
        putExtra(AlarmClock.EXTRA_SKIP_UI, true)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    AsyncFunction("showAlarms") {
      val intent = Intent(AlarmClock.ACTION_SHOW_ALARMS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }
}
