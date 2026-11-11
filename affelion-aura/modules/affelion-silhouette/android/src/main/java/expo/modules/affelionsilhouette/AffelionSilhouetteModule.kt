package expo.modules.affelionsilhouette

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AffelionSilhouetteModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AffelionSilhouette")

    Constants(
      // Android uses CameraX + ML Kit for both face and silhouette; ARCore is not required.
      "supportsARKitFaceTracking" to false
    )

    View(AffelionSilhouetteView::class) {
      Events("onMask", "onFace", "onStatus")

      Prop("active") { view: AffelionSilhouetteView, active: Boolean ->
        view.setActive(active)
      }

      Prop("maskSize") { view: AffelionSilhouetteView, size: Int ->
        view.maskLongSide = size.coerceIn(64, 512)
      }

      Prop("maskFps") { view: AffelionSilhouetteView, fps: Int ->
        view.maskIntervalMs = 1000L / fps.coerceIn(1, 60)
      }

      AsyncFunction("captureStill") { view: AffelionSilhouetteView, promise: Promise ->
        view.captureStill(promise)
      }
    }
  }
}
