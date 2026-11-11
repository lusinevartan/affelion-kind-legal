package expo.modules.affelionppg

import android.content.Context
import android.graphics.ImageFormat
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureRequest
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.util.Range
import android.util.Size
import android.view.Surface
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Camera2 pipeline for fingertip PPG: rear camera, torch on, small YUV stream, auto-exposure for a
 * short warm-up and then AE/AWB locked so the only thing changing frame to frame is blood volume.
 * Reports the centre-region mean colour per frame as normalised R, G, B.
 */
class PpgCaptureController(private val context: Context) {
  var onSample: ((t: Double, r: Double, g: Double, b: Double, locked: Boolean) -> Unit)? = null
  var onStatus: ((state: String, message: String?) -> Unit)? = null

  private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private var thread: HandlerThread? = null
  private var handler: Handler? = null
  private var camera: CameraDevice? = null
  private var session: CameraCaptureSession? = null
  private var reader: ImageReader? = null
  private var requestBuilder: CaptureRequest.Builder? = null
  private var roi = 0.5
  private var warmupMs = 1200L
  private var startedAt = 0L
  private var locked = false
  @Volatile private var running = false

  fun isAvailable(): Boolean = backCameraId() != null

  private fun backCameraId(): String? {
    return try {
      cameraManager.cameraIdList.firstOrNull { id ->
        val c = cameraManager.getCameraCharacteristics(id)
        c.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK &&
          c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
      }
    } catch (e: CameraAccessException) {
      null
    }
  }

  fun start(options: PpgStartOptions, completion: (Throwable?) -> Unit) {
    if (running) { completion(null); return }
    val id = backCameraId() ?: run {
      completion(IllegalStateException("No rear camera with flash")); return
    }
    roi = options.roi.coerceIn(0.1, 1.0)
    warmupMs = (options.warmupSeconds * 1000).toLong()
    locked = false
    val t = HandlerThread("affelion-ppg").also { it.start() }
    thread = t
    val h = Handler(t.looper)
    handler = h

    try {
      val characteristics = cameraManager.getCameraCharacteristics(id)
      val map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      val sizes = map?.getOutputSizes(ImageFormat.YUV_420_888) ?: emptyArray()
      val size = pickSize(sizes)
      val reader = ImageReader.newInstance(size.width, size.height, ImageFormat.YUV_420_888, 3)
      this.reader = reader
      reader.setOnImageAvailableListener({ r -> r.acquireLatestImage()?.let { img -> processImage(img) } }, h)

      cameraManager.openCamera(id, object : CameraDevice.StateCallback() {
        override fun onOpened(device: CameraDevice) {
          camera = device
          try {
            val builder = device.createCaptureRequest(CameraDevice.TEMPLATE_RECORD)
            builder.addTarget(reader.surface)
            configureRequest(builder, characteristics, options.fps, lock = false)
            requestBuilder = builder
            @Suppress("DEPRECATION")
            device.createCaptureSession(listOf(reader.surface), object : CameraCaptureSession.StateCallback() {
              override fun onConfigured(s: CameraCaptureSession) {
                session = s
                try {
                  s.setRepeatingRequest(builder.build(), null, h)
                  startedAt = SystemClock.elapsedRealtime()
                  running = true
                  onStatus?.invoke("running", null)
                  completion(null)
                } catch (e: Exception) {
                  onStatus?.invoke("error", e.message)
                  completion(e)
                }
              }
              override fun onConfigureFailed(s: CameraCaptureSession) {
                val e = IllegalStateException("Camera session configuration failed")
                onStatus?.invoke("error", e.message)
                completion(e)
              }
            }, h)
          } catch (e: Exception) {
            onStatus?.invoke("error", e.message)
            completion(e)
          }
        }
        override fun onDisconnected(device: CameraDevice) { stop() }
        override fun onError(device: CameraDevice, error: Int) {
          val e = IllegalStateException("Camera error $error")
          onStatus?.invoke("error", e.message)
          completion(e)
          stop()
        }
      }, h)
    } catch (e: Exception) {
      onStatus?.invoke("error", e.message)
      completion(e)
    }
  }

  private fun pickSize(sizes: Array<Size>): Size {
    // Smallest stream of at least 320x240 keeps per-frame work tiny and frame pacing steady.
    val candidates = sizes.filter { it.width >= 320 && it.height >= 240 }
    return candidates.minByOrNull { it.width * it.height } ?: sizes.minByOrNull { it.width * it.height } ?: Size(320, 240)
  }

  private fun configureRequest(b: CaptureRequest.Builder, c: CameraCharacteristics, fps: Int, lock: Boolean) {
    b.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
    b.set(CaptureRequest.CONTROL_AE_MODE, CameraMetadata.CONTROL_AE_MODE_ON)
    b.set(CaptureRequest.FLASH_MODE, CameraMetadata.FLASH_MODE_TORCH)
    b.set(CaptureRequest.CONTROL_AE_LOCK, lock)
    b.set(CaptureRequest.CONTROL_AWB_MODE, CameraMetadata.CONTROL_AWB_MODE_AUTO)
    b.set(CaptureRequest.CONTROL_AWB_LOCK, lock)
    b.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_OFF)
    b.set(CaptureRequest.NOISE_REDUCTION_MODE, CameraMetadata.NOISE_REDUCTION_MODE_OFF)
    // Nearest focus: the fingertip is on the lens.
    val minFocus = c.get(CameraCharacteristics.LENS_INFO_MINIMUM_FOCUS_DISTANCE) ?: 0f
    if (minFocus > 0f) {
      b.set(CaptureRequest.CONTROL_AF_MODE, CameraMetadata.CONTROL_AF_MODE_OFF)
      b.set(CaptureRequest.LENS_FOCUS_DISTANCE, minFocus)
    }
    val ranges = c.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)
    val target = ranges?.firstOrNull { it.lower == fps && it.upper == fps }
      ?: ranges?.filter { it.upper >= fps && it.lower <= fps }?.minByOrNull { it.upper - it.lower }
      ?: ranges?.minByOrNull { abs(it.upper - fps) }
    if (target != null) b.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, target)
  }

  private fun lockIfDue() {
    if (locked || !running) return
    if (SystemClock.elapsedRealtime() - startedAt < warmupMs) return
    val b = requestBuilder ?: return
    val s = session ?: return
    val h = handler ?: return
    locked = true
    try {
      b.set(CaptureRequest.CONTROL_AE_LOCK, true)
      b.set(CaptureRequest.CONTROL_AWB_LOCK, true)
      s.setRepeatingRequest(b.build(), null, h)
      onStatus?.invoke("locked", null)
    } catch (e: Exception) {
      onStatus?.invoke("error", "Could not lock exposure: ${e.message}")
    }
  }

  private fun processImage(image: Image) {
    try {
      if (!running) return
      lockIfDue()
      val w = image.width
      val h = image.height
      val roiW = (w * roi).toInt().coerceAtLeast(2)
      val roiH = (h * roi).toInt().coerceAtLeast(2)
      val x0 = (w - roiW) / 2
      val y0 = (h - roiH) / 2
      val step = 4

      val yPlane = image.planes[0]
      val uPlane = image.planes[1]
      val vPlane = image.planes[2]
      val yBuf = yPlane.buffer
      val uBuf = uPlane.buffer
      val vBuf = vPlane.buffer

      var sumY = 0L; var sumU = 0L; var sumV = 0L; var count = 0L
      var y = y0
      while (y < y0 + roiH) {
        var x = x0
        while (x < x0 + roiW) {
          val yi = y * yPlane.rowStride + x * yPlane.pixelStride
          val ci = (y / 2) * uPlane.rowStride + (x / 2) * uPlane.pixelStride
          if (yi < yBuf.limit() && ci < uBuf.limit() && ci < vBuf.limit()) {
            sumY += (yBuf.get(yi).toInt() and 0xFF)
            sumU += (uBuf.get(ci).toInt() and 0xFF)
            sumV += (vBuf.get(ci).toInt() and 0xFF)
            count++
          }
          x += step
        }
        y += step
      }
      if (count == 0L) return
      val my = sumY.toDouble() / count
      val mu = sumU.toDouble() / count - 128.0
      val mv = sumV.toDouble() / count - 128.0
      // BT.601 full-range conversion of the mean (linear, so mean of YUV → mean of RGB holds).
      val r = clamp01((my + 1.402 * mv) / 255.0)
      val g = clamp01((my - 0.344136 * mu - 0.714136 * mv) / 255.0)
      val b = clamp01((my + 1.772 * mu) / 255.0)
      val t = image.timestamp / 1e9
      onSample?.invoke(t, r, g, b, locked)
    } finally {
      image.close()
    }
  }

  private fun clamp01(v: Double) = max(0.0, min(1.0, v))

  fun stop() {
    if (!running && camera == null) return
    running = false
    try { session?.stopRepeating() } catch (_: Exception) {}
    try {
      // Turn the torch off explicitly before tearing down.
      val b = requestBuilder
      val s = session
      val h = handler
      if (b != null && s != null && h != null) {
        b.set(CaptureRequest.FLASH_MODE, CameraMetadata.FLASH_MODE_OFF)
        s.capture(b.build(), null, h)
      }
    } catch (_: Exception) {}
    try { session?.close() } catch (_: Exception) {}
    try { camera?.close() } catch (_: Exception) {}
    try { reader?.close() } catch (_: Exception) {}
    session = null
    camera = null
    reader = null
    requestBuilder = null
    thread?.quitSafely()
    thread = null
    handler = null
    onStatus?.invoke("stopped", null)
  }
}
