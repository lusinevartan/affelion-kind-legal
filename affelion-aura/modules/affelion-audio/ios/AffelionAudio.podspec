Pod::Spec.new do |s|
  s.name           = 'AffelionAudio'
  s.version        = '1.0.0'
  s.summary        = 'Raw PCM microphone capture for Affelion Aura voice analysis'
  s.description    = 'Streams 16 kHz mono float PCM chunks to JavaScript. Nothing is written to disk.'
  s.author         = 'Affelion'
  s.homepage       = 'https://affelion.com'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
