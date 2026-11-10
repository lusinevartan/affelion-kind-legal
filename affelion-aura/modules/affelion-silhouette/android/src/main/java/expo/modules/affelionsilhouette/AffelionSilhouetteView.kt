package expo.modules.affelionsilhouette

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Matrix
import android.net.Uri
import android.os.SystemClock
import android.util.Base64
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import android.util.Size

/**
 * Front-camera preview (CameraX) with ML Kit selfie segmentation and face detection.
 *
 * Mask convention matches iOS: 8-bit, portrait display orientation, mirrored like the preview,
 * top-left origin, covering the full camera image which the preview shows aspect-filled.
 */
@SuppressLint("ViewConstructor")
class AffelionSilhouetteView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onMask by EventDispatcher()
  private val onFace by EventDispatcher()
  private val onStatus by EventDispatcher()

  var maskLongSide = 160
  var maskIntervalMs = 66L

  private val previewView = PreviewView(context).apply {
    scaleType = PreviewView.ScaleType.FILL_CENTER
    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
  }
  private var cameraProvider: ProcessCameraProvider? = null
  private var imageCapture: ImageCapture? = null
  private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private val busy = AtomicBoolean(false)
  private var lastMaskAt = 0L
  private var frameIndex = 0
  private var active = false

  private val segmenter = Segmentation.getClient(
    SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
      .enableRawSizeMask()
      .build()
  )
  private val faceDetector = FaceDetection.getClient(
    FaceDetectorOptions.Builder()
      .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
      .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
      .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
      .setMinFaceSize(0.15f)
      .build()
  )

  init {
    addView(previewView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  fun setActive(on: Boolean) {
    if (on == active) return
    active = on
    if (on) start() else stop()
  }

  private fun start() {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      onStatus(mapOf("state" to "error", "message" to "Camera permission not granted"))
      return
    }
    val lifecycleOwner = appContext.currentActivity as? LifecycleOwner ?: run {
      onStatus(mapOf("state" to "error", "message" to "No lifecycle owner"))
      return
    }
    val future = ProcessCameraProvider.getInstance(context)
    future.addListener({
      try {
        val provider = future.get()
        cameraProvider = provider
        val preview = Preview.Builder().build().also { it.surfaceProvider = previewView.surfaceProvider }
        val analysis = ImageAnalysis.Builder()
          .setResolutionSelector(
            ResolutionSelector.Builder()
              .setResolutionStrategy(ResolutionStrategy(Size(480, 640), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER))
              .build()
          )
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
          .build()
        analysis.setAnalyzer(analysisExecutor) { proxy -> analyse(proxy) }
        val capture = ImageCapture.Builder()
          .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
          .setTargetRotation(android.view.Surface.ROTATION_0)
          .build()
        imageCapture = capture
        provider.unbindAll()
        provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_FRONT_CAMERA, preview, analysis, capture)
        onStatus(mapOf("state" to "running", "source" to "camerax-mlkit"))
      } catch (e: Exception) {
        onStatus(mapOf("state" to "error", "message" to (e.message ?: "Camera start failed")))
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun stop() {
    try { cameraProvider?.unbindAll() } catch (_: Exception) {}
    cameraProvider = null
    imageCapture = null
    onStatus(mapOf("state" to "stopped"))
  }

  override fun onDetachedFromWindow() {
    stop()
    super.onDetachedFromWindow()
  }

  @SuppressLint("UnsafeOptInUsageError")
  private fun analyse(proxy: ImageProxy) {
    val media = proxy.image
    if (media == null || !active) { proxy.close(); return }
    val rotation = proxy.imageInfo.rotationDegrees
    val now = SystemClock.elapsedRealtime()
    val due = now - lastMaskAt >= maskIntervalMs
    if (!due || !busy.compareAndSet(false, true)) { proxy.close(); return }
    lastMaskAt = now
    frameIndex++
    val input = InputImage.fromMediaImage(media, rotation)
    // Rotated (display) dimensions.
    val dispW = if (rotation % 180 == 0) proxy.width else proxy.height
    val dispH = if (rotation % 180 == 0) proxy.height else proxy.width
    val runFace = frameIndex % 2 == 0

    segmenter.process(input)
      .addOnSuccessListener { mask ->
        emitMask(mask.buffer, mask.width, mask.height, dispW.toDouble() / dispH.toDouble())
      }
      .addOnCompleteListener {
        if (runFace) {
          faceDetector.process(input)
            .addOnSuccessListener { faces ->
              val f = faces.maxByOrNull { it.boundingBox.width() * it.boundingBox.height() }
              if (f == null) {
                onFace(mapOf("detected" to false))
              } else {
                val bb = f.boundingBox
                // Mirror x so the metrics match the mirrored preview.
                val cx = 1.0 - bb.exactCenterX() / dispW.toDouble()
                val cy = bb.exactCenterY() / dispH.toDouble()
                onFace(mapOf(
                  "detected" to true,
                  "cx" to cx, "cy" to cy,
                  "width" to bb.width() / dispW.toDouble(),
                  "height" to bb.height() / dispH.toDouble(),
                  "yaw" to Math.toRadians(-f.headEulerAngleY.toDouble()),
                  "pitch" to Math.toRadians(f.headEulerAngleX.toDouble()),
                  "roll" to Math.toRadians(-f.headEulerAngleZ.toDouble()),
                ))
              }
            }
            .addOnCompleteListener { proxy.close(); busy.set(false) }
        } else {
          proxy.close(); busy.set(false)
        }
      }
  }

  /** ML Kit raw masks are 256×256 floats (confidence) regardless of aspect; resample to our size, mirrored. */
  private fun emitMask(buffer: java.nio.ByteBuffer, mw: Int, mh: Int, imageAspect: Double) {
    val longSide = maskLongSide
    val outW: Int
    val outH: Int
    if (imageAspect <= 1.0) { outH = longSide; outW = maxOf(1, (longSide * imageAspect).toInt()) }
    else { outW = longSide; outH = maxOf(1, (longSide / imageAspect).toInt()) }
    val out = ByteArray(outW * outH)
    buffer.rewind()
    val floats = buffer.asFloatBuffer()
    for (y in 0 until outH) {
      val sy = minOf(mh - 1, (y * mh) / outH)
      for (x in 0 until outW) {
        // Mirror horizontally to match the front-camera preview.
        val sx = minOf(mw - 1, ((outW - 1 - x) * mw) / outW)
        val v = floats.get(sy * mw + sx)
        out[y * outW + x] = (v.coerceIn(0f, 1f) * 255f).toInt().toByte()
      }
    }
    val encoded = Base64.encodeToString(out, Base64.NO_WRAP)
    onMask(mapOf("width" to outW, "height" to outH, "imageAspect" to imageAspect, "data" to encoded))
  }

  fun captureStill(promise: Promise) {
    val capture = imageCapture ?: run {
      promise.reject(CodedException("E_CAPTURE", "Camera is not running", null)); return
    }
    val file = File(context.cacheDir, "aura-still-${System.currentTimeMillis()}.jpg")
    val metadata = ImageCapture.Metadata().apply { isReversedHorizontal = true } // mirror like the preview
    val options = ImageCapture.OutputFileOptions.Builder(file).setMetadata(metadata).build()
    capture.takePicture(options, ContextCompat.getMainExecutor(context), object : ImageCapture.OnImageSavedCallback {
      override fun onImageSaved(output: ImageCapture.OutputFileResults) {
        promise.resolve(mapOf("uri" to Uri.fromFile(file).toString(), "width" to 0, "height" to 0))
      }
      override fun onError(exception: ImageCaptureException) {
        promise.reject(CodedException("E_CAPTURE", exception.message ?: "Capture failed", exception))
      }
    })
  }
}
