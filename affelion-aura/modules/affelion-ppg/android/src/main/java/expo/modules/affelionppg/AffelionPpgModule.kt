package expo.modules.affelionppg

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class PpgStartOptions : Record {
  @Field val torchLevel: Double = 0.6
  @Field val fps: Int = 30
  @Field val roi: Double = 0.5
  @Field val warmupSeconds: Double = 1.2
}

class AffelionPpgModule : Module() {
  private var controller: PpgCaptureController? = null

  private val context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  override fun definition() = ModuleDefinition {
    Name("AffelionPpg")

    Events("onSample", "onStatus")

    OnCreate {
      controller = PpgCaptureController(context).also { c ->
        c.onSample = { t, r, g, b, locked ->
          sendEvent("onSample", bundleOf("t" to t, "r" to r, "g" to g, "b" to b, "locked" to locked))
        }
        c.onStatus = { state, message ->
          sendEvent("onStatus", bundleOf("state" to state, "message" to message))
        }
      }
    }

    OnDestroy {
      controller?.stop()
      controller = null
    }

    AsyncFunction("isAvailable") {
      controller?.isAvailable() ?: false
    }

    AsyncFunction("permissionStatus") {
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) "granted" else "undetermined"
    }

    AsyncFunction("start") { options: PpgStartOptions, promise: Promise ->
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        promise.reject(CodedException("E_PPG_START", "Camera permission not granted", null))
        return@AsyncFunction
      }
      val c = controller ?: run {
        promise.reject(CodedException("E_PPG_START", "Controller unavailable", null))
        return@AsyncFunction
      }
      c.start(options) { error ->
        if (error == null) promise.resolve(null)
        else promise.reject(CodedException("E_PPG_START", error.message ?: "Failed to start camera", error))
      }
    }

    AsyncFunction("stop") {
      controller?.stop()
    }
  }
}
