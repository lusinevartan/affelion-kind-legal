package expo.modules.affelionaudio

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.concurrent.thread

/**
 * Streams 16 kHz mono float PCM to JavaScript as little-endian Float32 bytes.
 * Audio is never written to disk.
 */
class AffelionAudioModule : Module() {
  private val sampleRate = 16000
  private var record: AudioRecord? = null
  private var worker: Thread? = null
  @Volatile private var running = false

  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("AffelionAudio")

    Events("onPcm", "onStatus")

    OnDestroy { stop() }

    AsyncFunction("permissionStatus") {
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) "granted" else "undetermined"
    }

    AsyncFunction("requestPermission") { promise: Promise ->
      // Prompting is handled by expo-camera's microphone permission on the JS side; report state.
      val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
      promise.resolve(if (granted) "granted" else "undetermined")
    }

    AsyncFunction("start") { promise: Promise ->
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        promise.reject(CodedException("E_AUDIO_START", "Microphone permission not granted", null))
        return@AsyncFunction
      }
      try {
        start()
        promise.resolve(mapOf("sampleRate" to sampleRate.toDouble()))
      } catch (e: Exception) {
        promise.reject(CodedException("E_AUDIO_START", e.message ?: "Could not start audio", e))
      }
    }

    AsyncFunction("stop") { stop() }
  }

  @Suppress("MissingPermission")
  private fun start() {
    if (running) return
    val minBuf = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT)
    val bufSize = maxOf(minBuf, 4096 * 4)
    val rec = AudioRecord(MediaRecorder.AudioSource.UNPROCESSED, sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT, bufSize)
    val usable = if (rec.state == AudioRecord.STATE_INITIALIZED) rec else {
      rec.release()
      AudioRecord(MediaRecorder.AudioSource.MIC, sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT, bufSize)
    }
    if (usable.state != AudioRecord.STATE_INITIALIZED) {
      usable.release()
      throw IllegalStateException("AudioRecord could not be initialised")
    }
    record = usable
    running = true
    usable.startRecording()
    sendEvent("onStatus", mapOf("state" to "running"))
    worker = thread(name = "affelion-audio", isDaemon = true) {
      val floats = FloatArray(1024)
      val bytes = ByteBuffer.allocate(floats.size * 4).order(ByteOrder.LITTLE_ENDIAN)
      while (running) {
        val n = usable.read(floats, 0, floats.size, AudioRecord.READ_BLOCKING)
        if (n <= 0) continue
        bytes.clear()
        for (i in 0 until n) bytes.putFloat(floats[i])
        val out = ByteArray(n * 4)
        bytes.flip()
        bytes.get(out)
        sendEvent("onPcm", mapOf("sampleRate" to sampleRate.toDouble(), "data" to out))
      }
    }
  }

  private fun stop() {
    if (!running) return
    running = false
    try { record?.stop() } catch (_: Exception) {}
    try { record?.release() } catch (_: Exception) {}
    record = null
    worker = null
    sendEvent("onStatus", mapOf("state" to "stopped"))
  }
}
