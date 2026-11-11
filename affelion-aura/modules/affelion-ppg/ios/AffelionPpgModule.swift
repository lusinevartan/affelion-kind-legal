import ExpoModulesCore
import AVFoundation

struct PpgStartOptions: Record {
  /// Torch brightness 0..1. 0.6 keeps the lens cool over a 45 s read while staying well above noise.
  @Field var torchLevel: Double = 0.6
  /// Frames per second to request from the camera.
  @Field var fps: Int = 30
  /// Fraction of width/height used for the centre region of interest.
  @Field var roi: Double = 0.5
  /// Seconds of auto exposure before locking exposure and white balance.
  @Field var warmupSeconds: Double = 1.2
}

public class AffelionPpgModule: Module {
  private let controller = PpgCaptureController()

  public func definition() -> ModuleDefinition {
    Name("AffelionPpg")

    Events("onSample", "onStatus")

    OnCreate {
      controller.onSample = { [weak self] sample in
        self?.sendEvent("onSample", sample)
      }
      controller.onStatus = { [weak self] status in
        self?.sendEvent("onStatus", status)
      }
    }

    OnDestroy {
      controller.stop()
    }

    AsyncFunction("isAvailable") { () -> Bool in
      return PpgCaptureController.isAvailable()
    }

    AsyncFunction("permissionStatus") { () -> String in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized: return "granted"
      case .denied, .restricted: return "denied"
      default: return "undetermined"
      }
    }

    AsyncFunction("start") { (options: PpgStartOptions, promise: Promise) in
      controller.start(options: options) { error in
        if let error = error {
          promise.reject("E_PPG_START", error)
        } else {
          promise.resolve(nil)
        }
      }
    }

    AsyncFunction("stop") { () in
      controller.stop()
    }
  }
}

/// Owns an AVCaptureSession on the rear wide camera with the torch on. Per frame it averages the
/// centre region of the BGRA buffer and reports normalised mean red/green/blue with a timestamp.
final class PpgCaptureController: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  var onSample: (([String: Any]) -> Void)?
  var onStatus: (([String: Any]) -> Void)?

  private let session = AVCaptureSession()
  private let sessionQueue = DispatchQueue(label: "com.affelion.aura.ppg.session")
  private let frameQueue = DispatchQueue(label: "com.affelion.aura.ppg.frames", qos: .userInteractive)
  private var device: AVCaptureDevice?
  private var output: AVCaptureVideoDataOutput?
  private var roi: Double = 0.5
  private var warmupSeconds: Double = 1.2
  private var torchLevel: Float = 0.6
  private var startedAt: CFTimeInterval = 0
  private var locked = false
  private var running = false

  static func isAvailable() -> Bool {
    guard let d = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else { return false }
    return d.hasTorch
  }

  func start(options: PpgStartOptions, completion: @escaping (Error?) -> Void) {
    sessionQueue.async { [weak self] in
      guard let self = self else { return }
      if self.running { completion(nil); return }
      guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
        completion(NSError(domain: "AffelionPpg", code: 1, userInfo: [NSLocalizedDescriptionKey: "Camera permission not granted"]))
        return
      }
      guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
        completion(NSError(domain: "AffelionPpg", code: 2, userInfo: [NSLocalizedDescriptionKey: "No rear camera"]))
        return
      }
      guard device.hasTorch else {
        completion(NSError(domain: "AffelionPpg", code: 3, userInfo: [NSLocalizedDescriptionKey: "Rear camera has no torch"]))
        return
      }
      self.device = device
      self.roi = min(max(options.roi, 0.1), 1.0)
      self.warmupSeconds = options.warmupSeconds
      self.torchLevel = Float(min(max(options.torchLevel, 0.1), 1.0))
      self.locked = false

      do {
        self.session.beginConfiguration()
        self.session.sessionPreset = .vga640x480
        for input in self.session.inputs { self.session.removeInput(input) }
        for out in self.session.outputs { self.session.removeOutput(out) }
        let input = try AVCaptureDeviceInput(device: device)
        guard self.session.canAddInput(input) else { throw NSError(domain: "AffelionPpg", code: 4) }
        self.session.addInput(input)

        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: self.frameQueue)
        guard self.session.canAddOutput(output) else { throw NSError(domain: "AffelionPpg", code: 5) }
        self.session.addOutput(output)
        self.output = output
        self.session.commitConfiguration()

        try device.lockForConfiguration()
        // Fixed frame rate for uniform sampling.
        let fps = Int32(max(15, min(options.fps, 60)))
        if let range = device.activeFormat.videoSupportedFrameRateRanges.first(where: { $0.minFrameRate <= Double(fps) && $0.maxFrameRate >= Double(fps) }) {
          _ = range
          device.activeVideoMinFrameDuration = CMTime(value: 1, timescale: fps)
          device.activeVideoMaxFrameDuration = CMTime(value: 1, timescale: fps)
        }
        // Nearest focus: the fingertip sits on the lens.
        if device.isLockingFocusWithCustomLensPositionSupported {
          device.setFocusModeLocked(lensPosition: 0.0, completionHandler: nil)
        } else if device.isFocusModeSupported(.locked) {
          device.focusMode = .locked
        }
        // Start with auto exposure so the torch-lit finger is well exposed, then lock after warm-up.
        if device.isExposureModeSupported(.continuousAutoExposure) { device.exposureMode = .continuousAutoExposure }
        if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) { device.whiteBalanceMode = .continuousAutoWhiteBalance }
        device.unlockForConfiguration()

        self.session.startRunning()
        try device.lockForConfiguration()
        try device.setTorchModeOn(level: self.torchLevel)
        device.unlockForConfiguration()

        self.startedAt = CACurrentMediaTime()
        self.running = true
        self.onStatus?(["state": "running"])
        completion(nil)
      } catch {
        self.session.commitConfiguration()
        self.onStatus?(["state": "error", "message": error.localizedDescription])
        completion(error)
      }
    }
  }

  func stop() {
    sessionQueue.async { [weak self] in
      guard let self = self, self.running else { return }
      self.running = false
      if let device = self.device, device.hasTorch {
        try? device.lockForConfiguration()
        device.torchMode = .off
        if device.isExposureModeSupported(.continuousAutoExposure) { device.exposureMode = .continuousAutoExposure }
        if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) { device.whiteBalanceMode = .continuousAutoWhiteBalance }
        if device.isFocusModeSupported(.continuousAutoFocus) { device.focusMode = .continuousAutoFocus }
        device.unlockForConfiguration()
      }
      self.session.stopRunning()
      self.onStatus?(["state": "stopped"])
    }
  }

  private func lockExposureIfDue() {
    guard !locked, let device = device else { return }
    if CACurrentMediaTime() - startedAt < warmupSeconds { return }
    locked = true
    sessionQueue.async {
      do {
        try device.lockForConfiguration()
        if device.isExposureModeSupported(.locked) { device.exposureMode = .locked }
        if device.isWhiteBalanceModeSupported(.locked) { device.whiteBalanceMode = .locked }
        device.unlockForConfiguration()
        self.onStatus?(["state": "locked"])
      } catch {
        self.onStatus?(["state": "error", "message": "Could not lock exposure: \(error.localizedDescription)"])
      }
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard running, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    lockExposureIfDue()

    CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(pixelBuffer) else { return }
    let width = CVPixelBufferGetWidth(pixelBuffer)
    let height = CVPixelBufferGetHeight(pixelBuffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
    let ptr = base.assumingMemoryBound(to: UInt8.self)

    let roiW = Int(Double(width) * roi)
    let roiH = Int(Double(height) * roi)
    let x0 = (width - roiW) / 2
    let y0 = (height - roiH) / 2
    let step = 4 // sample every 4th pixel in both axes: 640x480 at roi 0.5 → 4,800 pixels per frame

    var sumR = 0, sumG = 0, sumB = 0, count = 0
    var y = y0
    while y < y0 + roiH {
      let row = ptr + y * bytesPerRow
      var x = x0
      while x < x0 + roiW {
        let px = row + x * 4 // BGRA
        sumB += Int(px[0])
        sumG += Int(px[1])
        sumR += Int(px[2])
        count += 1
        x += step
      }
      y += step
    }
    guard count > 0 else { return }
    let inv = 1.0 / (255.0 * Double(count))
    let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    let t = CMTimeGetSeconds(pts)
    onSample?([
      "t": t,
      "r": Double(sumR) * inv,
      "g": Double(sumG) * inv,
      "b": Double(sumB) * inv,
      "locked": locked,
    ])
  }
}
