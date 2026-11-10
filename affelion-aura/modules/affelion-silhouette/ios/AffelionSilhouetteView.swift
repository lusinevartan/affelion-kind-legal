import ExpoModulesCore
import ARKit
import AVFoundation
import Vision
import CoreImage
import UIKit

/**
 Front-camera preview with person segmentation and face metrics.

 Two frame sources share one pipeline:
   • ARKit (`ARFaceTrackingConfiguration`) on TrueDepth devices: face anchor gives a robust
     face centre, size and head pose; `ARSCNView` renders the camera feed.
   • AVFoundation fallback: `AVCaptureVideoPreviewLayer` plus `VNDetectFaceRectanglesRequest`.

 Both run `VNGeneratePersonSegmentationRequest` on the camera buffer and emit a low-resolution
 8-bit mask in *display* orientation (portrait, mirrored like the preview, top-left origin).
 The mask covers the full camera image, which the preview shows aspect-filled, so the renderer
 applies the same aspect-fill transform. See docs/ARCHITECTURE.md.
 */
final class AffelionSilhouetteView: ExpoView {
  let onMask = EventDispatcher()
  let onFace = EventDispatcher()
  let onStatus = EventDispatcher()

  var maskLongSide: Int = 160
  var maskInterval: Double = 1.0 / 15.0

  private var source: FrameSource?
  private var active = false
  private let visionQueue = DispatchQueue(label: "com.affelion.aura.silhouette.vision", qos: .userInitiated)
  private var visionBusy = false
  private var lastMaskAt: CFTimeInterval = 0
  private let ciContext = CIContext(options: [.useSoftwareRenderer: false])
  private var latestBuffer: CVPixelBuffer?
  private let bufferLock = NSLock()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .black
    clipsToBounds = true
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    source?.view.frame = bounds
  }

  func setActive(_ on: Bool) {
    guard on != active else { return }
    active = on
    if on { start() } else { stop() }
  }

  private func start() {
    guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
      onStatus(["state": "error", "message": "Camera permission not granted"])
      return
    }
    let src: FrameSource = ARFaceTrackingConfiguration.isSupported ? ARKitFrameSource() : AVFrameSource()
    src.delegate = self
    src.view.frame = bounds
    addSubview(src.view)
    source = src
    src.start()
    onStatus(["state": "running", "source": src.name])
  }

  private func stop() {
    source?.stop()
    source?.view.removeFromSuperview()
    source = nil
    onStatus(["state": "stopped"])
  }

  override func removeFromSuperview() {
    stop()
    super.removeFromSuperview()
  }

  // MARK: - Still capture

  func captureStill(_ completion: @escaping (Result<[String: Any], Error>) -> Void) {
    bufferLock.lock()
    let buffer = latestBuffer
    bufferLock.unlock()
    guard let pixelBuffer = buffer else {
      completion(.failure(NSError(domain: "AffelionSilhouette", code: 1, userInfo: [NSLocalizedDescriptionKey: "No camera frame yet"])))
      return
    }
    visionQueue.async { [weak self] in
      guard let self = self else { return }
      // Sensor buffers are landscape; rotate to portrait and mirror to match the preview.
      let ci = CIImage(cvPixelBuffer: pixelBuffer).oriented(.leftMirrored)
      guard let cg = self.ciContext.createCGImage(ci, from: ci.extent) else {
        completion(.failure(NSError(domain: "AffelionSilhouette", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not render frame"])))
        return
      }
      let image = UIImage(cgImage: cg)
      guard let data = image.jpegData(compressionQuality: 0.92) else {
        completion(.failure(NSError(domain: "AffelionSilhouette", code: 3)))
        return
      }
      let url = FileManager.default.temporaryDirectory.appendingPathComponent("aura-still-\(UInt64(Date().timeIntervalSince1970 * 1000)).jpg")
      do {
        try data.write(to: url)
        completion(.success(["uri": url.absoluteString, "width": Int(ci.extent.width), "height": Int(ci.extent.height)]))
      } catch {
        completion(.failure(error))
      }
    }
  }
}

// MARK: - Frame sources

protocol FrameSourceDelegate: AnyObject {
  func frameSource(_ source: FrameSource, didOutput pixelBuffer: CVPixelBuffer, face: FaceObservation?)
}

struct FaceObservation {
  /// Normalised to the displayed (portrait, mirrored) image. Origin top-left.
  var cx: Double
  var cy: Double
  var width: Double
  var height: Double
  var yaw: Double
  var pitch: Double
  var roll: Double
}

protocol FrameSource: AnyObject {
  var view: UIView { get }
  var name: String { get }
  var delegate: FrameSourceDelegate? { get set }
  func start()
  func stop()
}

/// ARKit face tracking. The ARSCNView draws the camera feed; we mirror it so it behaves like a mirror.
final class ARKitFrameSource: NSObject, FrameSource, ARSessionDelegate {
  let arView = ARSCNView()
  var view: UIView { arView }
  let name = "arkit"
  weak var delegate: FrameSourceDelegate?
  private var lastFace: ARFaceAnchor?

  override init() {
    super.init()
    arView.automaticallyUpdatesLighting = false
    arView.rendersContinuously = true
    arView.scene = SCNScene()
    arView.transform = CGAffineTransform(scaleX: -1, y: 1)
    arView.session.delegate = self
    arView.session.delegateQueue = DispatchQueue(label: "com.affelion.aura.silhouette.ar", qos: .userInitiated)
  }

  /// Yaw/pitch/roll (radians) from a rotation matrix, ZYX convention.
  private func eulerAngles(of m: simd_float4x4) -> (yaw: Float, pitch: Float, roll: Float) {
    let r = simd_float3x3(SIMD3<Float>(m.columns.0.x, m.columns.0.y, m.columns.0.z),
                          SIMD3<Float>(m.columns.1.x, m.columns.1.y, m.columns.1.z),
                          SIMD3<Float>(m.columns.2.x, m.columns.2.y, m.columns.2.z))
    let pitch = asinf(max(-1, min(1, -r[2][1])))
    let yaw = atan2f(r[2][0], r[2][2])
    let roll = atan2f(r[0][1], r[1][1])
    return (yaw, pitch, roll)
  }

  func start() {
    let config = ARFaceTrackingConfiguration()
    config.maximumNumberOfTrackedFaces = 1
    config.isLightEstimationEnabled = false
    arView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
  }

  func stop() {
    arView.session.pause()
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    let faceAnchor = frame.anchors.compactMap { $0 as? ARFaceAnchor }.first(where: { $0.isTracked })
    var face: FaceObservation? = nil
    if let anchor = faceAnchor {
      // Project the face centre and an approximate head-height point into portrait image space.
      let imageSize = CGSize(width: CGFloat(CVPixelBufferGetHeight(frame.capturedImage)), height: CGFloat(CVPixelBufferGetWidth(frame.capturedImage)))
      let center = anchor.transform.columns.3
      let centerPoint = frame.camera.projectPoint(SIMD3<Float>(center.x, center.y, center.z), orientation: .portrait, viewportSize: imageSize)
      let top = anchor.transform * SIMD4<Float>(0, 0.11, 0, 1)
      let topPoint = frame.camera.projectPoint(SIMD3<Float>(top.x, top.y, top.z), orientation: .portrait, viewportSize: imageSize)
      let halfH = abs(Double(centerPoint.y - topPoint.y))
      let euler = eulerAngles(of: anchor.transform)
      // Mirror x to match the mirrored preview.
      face = FaceObservation(
        cx: 1.0 - Double(centerPoint.x / imageSize.width),
        cy: Double(centerPoint.y / imageSize.height),
        width: (halfH * 2 * 0.78) / Double(imageSize.width),
        height: (halfH * 2) / Double(imageSize.height),
        yaw: Double(-euler.yaw), pitch: Double(euler.pitch), roll: Double(-euler.roll))
    }
    delegate?.frameSource(self, didOutput: frame.capturedImage, face: face)
  }
}

/// AVFoundation + Vision fallback for devices without TrueDepth.
final class AVFrameSource: NSObject, FrameSource, AVCaptureVideoDataOutputSampleBufferDelegate {
  let previewView = UIView()
  var view: UIView { previewView }
  let name = "avfoundation"
  weak var delegate: FrameSourceDelegate?
  private let session = AVCaptureSession()
  private let queue = DispatchQueue(label: "com.affelion.aura.silhouette.av")
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private let faceRequest = VNDetectFaceRectanglesRequest()
  private var frameIndex = 0
  private var lastFace: FaceObservation?

  func start() {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.session.beginConfiguration()
      self.session.sessionPreset = .hd1280x720
      if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
         let input = try? AVCaptureDeviceInput(device: device), self.session.canAddInput(input) {
        self.session.addInput(input)
      }
      let output = AVCaptureVideoDataOutput()
      output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
      output.alwaysDiscardsLateVideoFrames = true
      output.setSampleBufferDelegate(self, queue: self.queue)
      if self.session.canAddOutput(output) { self.session.addOutput(output) }
      self.session.commitConfiguration()
      DispatchQueue.main.async {
        let layer = AVCaptureVideoPreviewLayer(session: self.session)
        layer.videoGravity = .resizeAspectFill
        layer.frame = self.previewView.bounds
        self.previewView.layer.addSublayer(layer)
        self.previewLayer = layer
        self.previewView.layer.setNeedsLayout()
      }
      self.session.startRunning()
    }
  }

  func stop() {
    queue.async { [weak self] in self?.session.stopRunning() }
    previewLayer?.removeFromSuperlayer()
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    DispatchQueue.main.async { [weak self] in self?.previewLayer?.frame = self?.previewView.bounds ?? .zero }
    frameIndex += 1
    if frameIndex % 3 == 0 {
      // Sensor is landscape-left for the front camera; .leftMirrored matches the mirrored portrait preview.
      let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .leftMirrored, options: [:])
      try? handler.perform([faceRequest])
      if let f = (faceRequest.results)?.first {
        let bb = f.boundingBox // normalised, origin bottom-left
        lastFace = FaceObservation(cx: bb.midX, cy: 1 - bb.midY, width: bb.width, height: bb.height,
                                   yaw: Double(truncating: f.yaw ?? 0), pitch: Double(truncating: f.pitch ?? 0), roll: Double(truncating: f.roll ?? 0))
      } else {
        lastFace = nil
      }
    }
    delegate?.frameSource(self, didOutput: pixelBuffer, face: lastFace)
  }
}

// MARK: - Segmentation pipeline

extension AffelionSilhouetteView: FrameSourceDelegate {
  func frameSource(_ source: FrameSource, didOutput pixelBuffer: CVPixelBuffer, face: FaceObservation?) {
    bufferLock.lock()
    latestBuffer = pixelBuffer
    bufferLock.unlock()

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      if let f = face {
        self.onFace(["detected": true, "cx": f.cx, "cy": f.cy, "width": f.width, "height": f.height, "yaw": f.yaw, "pitch": f.pitch, "roll": f.roll])
      } else {
        self.onFace(["detected": false])
      }
    }

    let now = CACurrentMediaTime()
    guard now - lastMaskAt >= maskInterval, !visionBusy else { return }
    lastMaskAt = now
    visionBusy = true
    visionQueue.async { [weak self] in
      guard let self = self else { return }
      defer { self.visionBusy = false }
      self.segment(pixelBuffer)
    }
  }

  private func segment(_ pixelBuffer: CVPixelBuffer) {
    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .balanced
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .leftMirrored, options: [:])
    do {
      try handler.perform([request])
    } catch {
      return
    }
    guard let result = request.results?.first as? VNPixelBufferObservation else { return }
    let mask = result.pixelBuffer
    // The observation is in the *rotated* orientation we requested, so width < height for portrait.
    CVPixelBufferLockBaseAddress(mask, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(mask) else { return }
    let mw = CVPixelBufferGetWidth(mask)
    let mh = CVPixelBufferGetHeight(mask)
    let stride = CVPixelBufferGetBytesPerRow(mask)
    let src = base.assumingMemoryBound(to: UInt8.self)

    // Downsample with nearest sampling to the requested long side, keeping aspect.
    let longSide = maskLongSide
    let outW: Int, outH: Int
    if mh >= mw { outH = longSide; outW = max(1, Int(Double(longSide) * Double(mw) / Double(mh))) }
    else { outW = longSide; outH = max(1, Int(Double(longSide) * Double(mh) / Double(mw))) }
    var out = Data(count: outW * outH)
    out.withUnsafeMutableBytes { (raw: UnsafeMutableRawBufferPointer) in
      guard let dst = raw.baseAddress?.assumingMemoryBound(to: UInt8.self) else { return }
      for y in 0..<outH {
        let sy = min(mh - 1, (y * mh) / outH)
        let row = src + sy * stride
        for x in 0..<outW {
          let sx = min(mw - 1, (x * mw) / outW)
          dst[y * outW + x] = row[sx]
        }
      }
    }
    let imageAspect = Double(mw) / Double(mh)
    // Base64 keeps the payload JSON-safe through the view event system on both platforms.
    let encoded = out.base64EncodedString()
    DispatchQueue.main.async { [weak self] in
      self?.onMask(["width": outW, "height": outH, "imageAspect": imageAspect, "data": encoded])
    }
  }
}
