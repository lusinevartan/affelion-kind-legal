import ExpoModulesCore
import ARKit

public class AffelionSilhouetteModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AffelionSilhouette")

    Constants([
      "supportsARKitFaceTracking": ARFaceTrackingConfiguration.isSupported,
    ])

    View(AffelionSilhouetteView.self) {
      Events("onMask", "onFace", "onStatus")

      Prop("active") { (view: AffelionSilhouetteView, active: Bool) in
        view.setActive(active)
      }

      Prop("maskSize") { (view: AffelionSilhouetteView, size: Int) in
        view.maskLongSide = max(64, min(size, 512))
      }

      Prop("maskFps") { (view: AffelionSilhouetteView, fps: Int) in
        view.maskInterval = 1.0 / Double(max(1, min(fps, 60)))
      }

      AsyncFunction("captureStill") { (view: AffelionSilhouetteView, promise: Promise) in
        view.captureStill { result in
          switch result {
          case .success(let dict): promise.resolve(dict)
          case .failure(let error): promise.reject("E_CAPTURE", error.localizedDescription)
          }
        }
      }
    }
  }
}
