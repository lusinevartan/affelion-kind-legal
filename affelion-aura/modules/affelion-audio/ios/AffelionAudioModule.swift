import ExpoModulesCore
import AVFoundation

public class AffelionAudioModule: Module {
  private let engine = AVAudioEngine()
  private var converter: AVAudioConverter?
  private var running = false
  private let targetRate: Double = 16000

  public func definition() -> ModuleDefinition {
    Name("AffelionAudio")

    Events("onPcm", "onStatus")

    OnDestroy { self.stopEngine() }

    AsyncFunction("permissionStatus") { () -> String in
      switch AVAudioSession.sharedInstance().recordPermission {
      case .granted: return "granted"
      case .denied: return "denied"
      default: return "undetermined"
      }
    }

    AsyncFunction("requestPermission") { (promise: Promise) in
      AVAudioSession.sharedInstance().requestRecordPermission { granted in
        promise.resolve(granted ? "granted" : "denied")
      }
    }

    AsyncFunction("start") { (promise: Promise) in
      do {
        try self.startEngine()
        promise.resolve(["sampleRate": self.targetRate])
      } catch {
        promise.reject("E_AUDIO_START", error.localizedDescription)
      }
    }

    AsyncFunction("stop") { () in
      self.stopEngine()
    }
  }

  private func startEngine() throws {
    if running { return }
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement, options: [])
    try session.setActive(true, options: [])

    let input = engine.inputNode
    let inputFormat = input.inputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0 else {
      throw NSError(domain: "AffelionAudio", code: 1, userInfo: [NSLocalizedDescriptionKey: "No audio input"])
    }
    guard let outFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: targetRate, channels: 1, interleaved: false),
          let conv = AVAudioConverter(from: inputFormat, to: outFormat) else {
      throw NSError(domain: "AffelionAudio", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create converter"])
    }
    converter = conv
    input.removeTap(onBus: 0)
    input.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
      self?.handle(buffer: buffer, outFormat: outFormat)
    }
    engine.prepare()
    try engine.start()
    running = true
    sendEvent("onStatus", ["state": "running"])
  }

  private func handle(buffer: AVAudioPCMBuffer, outFormat: AVAudioFormat) {
    guard let converter = converter else { return }
    let ratio = outFormat.sampleRate / buffer.format.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 16
    guard let out = AVAudioPCMBuffer(pcmFormat: outFormat, frameCapacity: capacity) else { return }
    var consumed = false
    var error: NSError?
    let status = converter.convert(to: out, error: &error) { _, outStatus in
      if consumed {
        outStatus.pointee = .noDataNow
        return nil
      }
      consumed = true
      outStatus.pointee = .haveData
      return buffer
    }
    guard status != .error, error == nil, let channel = out.floatChannelData?[0], out.frameLength > 0 else { return }
    let data = Data(bytes: channel, count: Int(out.frameLength) * MemoryLayout<Float>.size)
    sendEvent("onPcm", ["sampleRate": outFormat.sampleRate, "data": data])
  }

  private func stopEngine() {
    guard running else { return }
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    running = false
    converter = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    sendEvent("onStatus", ["state": "stopped"])
  }
}
