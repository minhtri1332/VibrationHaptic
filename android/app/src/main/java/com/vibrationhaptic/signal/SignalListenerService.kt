package com.vibrationhaptic.signal

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.vibrationhaptic.MainActivity
import com.vibrationhaptic.R

/**
 * Foreground service that listens to `/signals/{deviceId}` in Realtime Database and vibrates
 * 1 = 1 ... 4 = 4 pulses. Lives outside the JS runtime so it keeps working while
 * the app is in the background, and vibrates as an alarm so silent mode does not
 * mute it.
 */
class SignalListenerService : Service() {

  private var signalRef: DatabaseReference? = null
  private var listener: ValueEventListener? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      buildNotification(getString(R.string.signal_notification_waiting)),
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      } else {
        0
      },
    )
    acquireWakeLock()
    // A null intent means the system restarted us; fall back to the last device id.
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val deviceId =
      intent?.getStringExtra(EXTRA_DEVICE_ID)?.also {
        prefs.edit().putString(EXTRA_DEVICE_ID, it).apply()
      } ?: prefs.getString(EXTRA_DEVICE_ID, null)
    if (deviceId == null) {
      Log.w(TAG, "No device id to listen for")
      stopSelf()
      return START_NOT_STICKY
    }
    listen(deviceId)
    // Restarted with a null intent if the system kills the process.
    return START_STICKY
  }

  private fun listen(deviceId: String) {
    val ref = FirebaseDatabase.getInstance().getReference("signals").child(deviceId)
    if (listener != null && ref == signalRef) return
    removeListener()
    signalRef = ref
    listener = ref.addValueEventListener(SignalListener(deviceId))
  }

  private fun removeListener() {
    listener?.let { signalRef?.removeEventListener(it) }
    listener = null
    signalRef = null
  }

  override fun onDestroy() {
    removeListener()
    vibrator().cancel()
    wakeLock?.takeIf { it.isHeld }?.release()
    wakeLock = null
    super.onDestroy()
  }

  private inner class SignalListener(private val deviceId: String) : ValueEventListener {
    // The first snapshot is whatever was sent before listening started; skip it.
    private var isInitial = true

    override fun onDataChange(snapshot: DataSnapshot) {
      if (isInitial) {
        isInitial = false
        return
      }
      val letter = snapshot.child("letter").getValue(String::class.java) ?: return
      val pulses = when (letter) {
        "1", "A" -> 1
        "2", "B" -> 2
        "3", "C" -> 3
        "4", "D" -> 4
        else -> LETTERS.indexOf(letter) + 1
      }
      if (pulses <= 0) return
      vibratePulses(pulses)
      notificationManager().notify(
        NOTIFICATION_ID,
        buildNotification(getString(R.string.signal_notification_received, letter, pulses)),
      )
    }

    override fun onCancelled(error: DatabaseError) {
      Log.w(TAG, "Listening to /signals/$deviceId cancelled", error.toException())
    }
  }

  private fun vibratePulses(pulses: Int) {
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val durationMs = prefs.getLong(KEY_DURATION_MS, DEFAULT_DURATION_MS).coerceIn(300L, 1000L)
    val amplitude = prefs.getInt(KEY_AMPLITUDE, DEFAULT_AMPLITUDE).coerceIn(100, 255)

    // Waveform alternates off/on: [0, on, gap, on, gap, on, ...].
    val timings = LongArray(pulses * 2) { i ->
      when {
        i == 0 -> 0L
        i % 2 == 0 -> GAP_MS
        else -> durationMs
      }
    }
    val amplitudes = IntArray(timings.size) { i ->
      if (i == 0 || i % 2 == 0) 0 else amplitude
    }

    val vibrator = vibrator()
    vibrator.cancel()
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
        val effect = if (vibrator.hasAmplitudeControl()) {
          VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
          VibrationEffect.createWaveform(timings, -1)
        }
        vibrator.vibrate(
          effect,
          VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM),
        )
      }
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> {
        val effect = if (vibrator.hasAmplitudeControl()) {
          VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
          VibrationEffect.createWaveform(timings, -1)
        }
        @Suppress("DEPRECATION")
        vibrator.vibrate(effect, alarmAudioAttributes())
      }
      else -> @Suppress("DEPRECATION") vibrator.vibrate(timings, -1, alarmAudioAttributes())
    }
  }

  private fun alarmAudioAttributes() =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

  private fun vibrator(): Vibrator =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

  // Keeps the CPU awake with the screen off so incoming signals are handled promptly.
  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) return
    wakeLock =
      (getSystemService(Context.POWER_SERVICE) as PowerManager)
        .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VibrationHaptic:SignalListener")
        .apply {
          setReferenceCounted(false)
          acquire()
        }
  }

  private fun notificationManager() =
    getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun buildNotification(text: String): android.app.Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager()
        .createNotificationChannel(
          NotificationChannel(
            CHANNEL_ID,
            getString(R.string.signal_channel_name),
            NotificationManager.IMPORTANCE_LOW,
          )
        )
    }
    val openApp =
      PendingIntent.getActivity(
        this,
        0,
        Intent(this, MainActivity::class.java),
        PendingIntent.FLAG_IMMUTABLE,
      )
    val stop =
      PendingIntent.getService(
        this,
        0,
        Intent(this, SignalListenerService::class.java).setAction(ACTION_STOP),
        PendingIntent.FLAG_IMMUTABLE,
      )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_signal)
      .setContentTitle(getString(R.string.signal_notification_title))
      .setContentText(text)
      .setContentIntent(openApp)
      .addAction(0, getString(R.string.signal_notification_stop), stop)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .build()
  }

  companion object {
    private const val TAG = "SignalListenerService"
    private const val CHANNEL_ID = "signal_listener"
    private const val NOTIFICATION_ID = 1001
    private const val ACTION_STOP = "com.vibrationhaptic.signal.STOP"
    private const val EXTRA_DEVICE_ID = "deviceId"
    private const val PREFS = "signal_listener"
    const val KEY_DURATION_MS = "vibration_duration_ms"
    const val KEY_AMPLITUDE = "vibration_amplitude"
    const val DEFAULT_DURATION_MS = 400L
    const val DEFAULT_AMPLITUDE = 255
    private const val GAP_MS = 300L
    private val LETTERS = listOf("1", "2", "3", "4")

    fun saveSettings(context: Context, durationMs: Long, amplitude: Int) {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      prefs.edit()
        .putLong(KEY_DURATION_MS, durationMs.coerceIn(300L, 1000L))
        .putInt(KEY_AMPLITUDE, amplitude.coerceIn(100, 255))
        .apply()
    }

    fun start(context: Context, deviceId: String) {
      androidx.core.content.ContextCompat.startForegroundService(
        context,
        Intent(context, SignalListenerService::class.java).putExtra(EXTRA_DEVICE_ID, deviceId),
      )
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, SignalListenerService::class.java))
    }
  }
}
