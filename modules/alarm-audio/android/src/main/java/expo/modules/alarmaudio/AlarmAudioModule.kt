package expo.modules.alarmaudio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The phone's alarm volume: reading it, setting it, and playing the dose alarm
 * sound on it.
 *
 * Alarms ring on their own audio stream, separate from the ringer, media and
 * notification volumes, which is why they still sound on vibrate or silent.
 * It is also why the volume buttons do nothing for them unless an alarm is
 * playing. Reading and setting this stream needs no permission.
 */
class AlarmAudioModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val audio: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private var player: MediaPlayer? = null

  override fun definition() = ModuleDefinition {
    Name("AlarmAudio")

    Function("getVolume") {
      val min = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        audio.getStreamMinVolume(AudioManager.STREAM_ALARM)
      } else {
        0
      }
      mapOf(
        "current" to audio.getStreamVolume(AudioManager.STREAM_ALARM),
        "min" to min,
        "max" to audio.getStreamMaxVolume(AudioManager.STREAM_ALARM),
      )
    }

    Function("setVolume") { level: Int ->
      audio.setStreamVolume(AudioManager.STREAM_ALARM, level, 0)
      audio.getStreamVolume(AudioManager.STREAM_ALARM)
    }

    /** Plays the real dose alarm sound, on the alarm stream, until stopped. */
    Function("startTestTone") {
      stopPlayer()
      val id = context.resources.getIdentifier("alarm_tone", "raw", context.packageName)
      if (id == 0) throw IllegalStateException("alarm_tone is missing from the app resources")

      val fd = context.resources.openRawResourceFd(id)
      val next = MediaPlayer()
      try {
        next.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        next.setDataSource(fd.fileDescriptor, fd.startOffset, fd.length)
        next.isLooping = true
        next.prepare()
        next.start()
        player = next
      } catch (error: Exception) {
        next.release()
        throw error
      } finally {
        fd.close()
      }
    }

    Function("stopTestTone") { stopPlayer() }

    OnDestroy { stopPlayer() }
  }

  private fun stopPlayer() {
    player?.let {
      runCatching { if (it.isPlaying) it.stop() }
      it.release()
    }
    player = null
  }
}
